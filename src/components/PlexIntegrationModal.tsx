import React, { useState, useEffect } from 'react';
import {
  Server,
  Music,
  ListMusic,
  Search,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  Play,
  CheckSquare,
  Square,
  AlertCircle,
  Radio,
  Flame,
} from 'lucide-react';
import { PlexStatus, PlexLibrary, PlexPlaylist, PlexTrack, Track } from '../types';
import { formatTime } from '../utils/audioController';

interface PlexIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTracks: (tracks: Track[]) => void;
  onPlayTrack?: (track: Track) => void;
}

export default function PlexIntegrationModal({
  isOpen,
  onClose,
  onImportTracks,
  onPlayTrack,
}: PlexIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'settings'>('browse');

  // Plex Connection State
  const [status, setStatus] = useState<PlexStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  // Browse State
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [playlists, setPlaylists] = useState<PlexPlaylist[]>([]);
  const [selectedLibraryKey, setSelectedLibraryKey] = useState<string>('');
  const [selectedPlaylistKey, setSelectedPlaylistKey] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<PlexTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

  // Fetch status on open
  useEffect(() => {
    if (isOpen) {
      checkPlexStatus();
    }
  }, [isOpen]);

  const checkPlexStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/plex/status');
      if (res.ok) {
        const data: PlexStatus = await res.json();
        setStatus(data);
        if (data.plexUrl) setUrlInput(data.plexUrl);
        if (data.connected) {
          fetchLibrariesAndPlaylists();
        } else if (!data.configured) {
          setActiveTab('settings');
        }
      }
    } catch (err) {
      console.warn('Failed to check Plex status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchLibrariesAndPlaylists = async () => {
    try {
      const [libRes, plRes] = await Promise.all([
        fetch('/api/plex/libraries'),
        fetch('/api/plex/playlists'),
      ]);

      if (libRes.ok) {
        const libs: PlexLibrary[] = await libRes.json();
        setLibraries(libs);
        if (libs.length > 0 && !selectedLibraryKey && !selectedPlaylistKey) {
          setSelectedLibraryKey(libs[0].key);
        }
      }

      if (plRes.ok) {
        const pls: PlexPlaylist[] = await plRes.json();
        setPlaylists(pls);
      }
    } catch (err) {
      console.warn('Error fetching Plex collections:', err);
    }
  };

  // Load tracks when library, playlist, or search changes
  useEffect(() => {
    if (!status?.connected) return;

    const loadTracks = async () => {
      setIsLoadingTracks(true);
      try {
        let endpoint = '';
        if (selectedPlaylistKey) {
          endpoint = `/api/plex/tracks?playlistKey=${encodeURIComponent(selectedPlaylistKey)}`;
        } else if (selectedLibraryKey) {
          endpoint = `/api/plex/tracks?sectionKey=${encodeURIComponent(selectedLibraryKey)}`;
          if (searchQuery.trim()) {
            endpoint += `&query=${encodeURIComponent(searchQuery.trim())}`;
          }
        } else {
          setIsLoadingTracks(false);
          return;
        }

        const res = await fetch(endpoint);
        if (res.ok) {
          const data: PlexTrack[] = await res.json();
          setTracks(data);
          setSelectedTrackIds(new Set());
        }
      } catch (err) {
        console.warn('Error loading tracks:', err);
      } finally {
        setIsLoadingTracks(false);
      }
    };

    const timer = setTimeout(loadTracks, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [selectedLibraryKey, selectedPlaylistKey, searchQuery, status?.connected]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg('');
    try {
      const res = await fetch('/api/plex/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plexUrl: urlInput,
          plexToken: tokenInput,
        }),
      });

      if (res.ok) {
        setConfigSuccessMsg('Configuration saved! Testing connection...');
        await checkPlexStatus();
        fetchLibrariesAndPlaylists();
      }
    } catch (err) {
      console.warn('Error saving Plex configuration:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const toggleSelectTrack = (trackId: string) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTrackIds.size === tracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(tracks.map((t) => t.id)));
    }
  };

  const handleImportSelected = () => {
    const selected = tracks.filter((t) => selectedTrackIds.has(t.id));
    if (selected.length === 0) return;

    const importedTracks: Track[] = selected.map((pt) => ({
      id: pt.id,
      title: pt.title,
      artist: pt.artist,
      album: pt.album,
      duration: pt.duration,
      url: pt.streamUrl,
      isLocalFile: false,
      source: 'plex',
      format: pt.format || 'MP3',
      addedAt: Date.now(),
      year: pt.year,
      bitrate: pt.bitrate,
      plexRatingKey: pt.ratingKey,
      plexPartKey: pt.mediaPartKey,
    }));

    onImportTracks(importedTracks);
    setSelectedTrackIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[720px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-black text-sm sm:text-base text-white tracking-wide">
                  PLEX MEDIA SERVER
                </h2>
                {status?.connected ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONNECTED
                  </span>
                ) : status?.configured ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                    UNREACHABLE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                    NOT CONFIGURED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Stream stoppage music & goal celebrations directly from your home server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BROWSE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SETTINGS
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Browse & Import */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar: Libraries & Playlists */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
              {!status?.connected ? (
                <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 gap-2 my-auto">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs font-bold">Plex Not Connected</p>
                  <p className="text-[11px] text-slate-500">
                    Enter your server URL and token in Settings to link your music library.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="mt-2 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs"
                  >
                    Open Settings
                  </button>
                </div>
              ) : (
                <>
                  {/* Playlists Section */}
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-1.5 px-2">
                      PLAYLISTS ({playlists.length})
                    </div>
                    <div className="space-y-1">
                      {playlists.map((pl) => {
                        const isSelected = selectedPlaylistKey === pl.key;
                        return (
                          <button
                            key={pl.ratingKey}
                            type="button"
                            onClick={() => {
                              setSelectedPlaylistKey(pl.key);
                              setSelectedLibraryKey('');
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left font-mono text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <ListMusic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{pl.title}</span>
                            </span>
                            {pl.leafCount !== undefined && (
                              <span className="text-[10px] text-slate-500 ml-1 shrink-0">
                                {pl.leafCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {playlists.length === 0 && (
                        <p className="text-[11px] text-slate-500 px-2 italic">No audio playlists</p>
                      )}
                    </div>
                  </div>

                  {/* Music Libraries Section */}
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-1.5 px-2">
                      MUSIC LIBRARIES
                    </div>
                    <div className="space-y-1">
                      {libraries.map((lib) => {
                        const isSelected = selectedLibraryKey === lib.key && !selectedPlaylistKey;
                        return (
                          <button
                            key={lib.key}
                            type="button"
                            onClick={() => {
                              setSelectedLibraryKey(lib.key);
                              setSelectedPlaylistKey('');
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left font-mono text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            <Music className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="truncate">{lib.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right: Track Browser */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40">
              {/* Search & Actions Bar */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Plex artist or track..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={tracks.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {selectedTrackIds.size === tracks.length && tracks.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    <span>SELECT ALL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportSelected}
                    disabled={selectedTrackIds.size === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-mono font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>IMPORT ({selectedTrackIds.size})</span>
                  </button>
                </div>
              </div>

              {/* Tracks List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                {isLoadingTracks ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    <p className="text-xs font-mono">Querying Plex Media Server...</p>
                  </div>
                ) : tracks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center">
                    <Music className="w-8 h-8 opacity-40" />
                    <p className="text-xs font-mono">
                      {status?.connected
                        ? 'No tracks found in this section or playlist.'
                        : 'Connect your Plex server to load your music.'}
                    </p>
                  </div>
                ) : (
                  tracks.map((track) => {
                    const isSelected = selectedTrackIds.has(track.id);
                    return (
                      <div
                        key={track.id}
                        onClick={() => toggleSelectTrack(track.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectTrack(track.id);
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p className="font-mono text-xs font-bold truncate text-white">
                              {track.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {track.artist}
                              {track.album && track.album !== track.title
                                ? ` • ${track.album}`
                                : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          {track.format && (
                            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {track.format}
                            </span>
                          )}
                          <span className="font-mono text-xs text-slate-400">
                            {formatTime(track.duration)}
                          </span>

                          {onPlayTrack && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTrack({
                                  id: track.id,
                                  title: track.title,
                                  artist: track.artist,
                                  album: track.album,
                                  duration: track.duration,
                                  url: track.streamUrl,
                                  isLocalFile: false,
                                  source: 'plex',
                                  format: track.format || 'MP3',
                                  addedAt: Date.now(),
                                });
                              }}
                              title="Preview / Play now"
                              className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Connection Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/30">
            <div className="max-w-xl mx-auto space-y-5">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <Server className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Current Connection Status</span>
                    <button
                      type="button"
                      onClick={checkPlexStatus}
                      disabled={isLoadingStatus}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                      <span>Test Status</span>
                    </button>
                  </div>

                  <p className="text-slate-400 mt-1">
                    {status?.connected ? (
                      <span className="text-emerald-400">
                        ✓ Connected to {status.serverName || 'Plex Server'} (Version{' '}
                        {status.version || 'Active'})
                      </span>
                    ) : status?.error ? (
                      <span className="text-rose-400">✗ {status.error}</span>
                    ) : (
                      'Plex is not yet configured. Provide your server IP and access token below.'
                    )}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    PLEX SERVER LOCAL URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="http://192.168.1.50:32400"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Usually http://[server-ip]:32400 or http://tower.local:32400 on Unraid.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    PLEX ACCESS TOKEN (X-Plex-Token)
                  </label>
                  <input
                    type="password"
                    placeholder={
                      status?.hasToken
                        ? '•••••••••••••••• (Leave blank to keep current token)'
                        : 'e.g. abc123XYZ456'
                    }
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Find this token by viewing XML info on any track in Plex Web App.
                  </p>
                </div>

                {configSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                    {configSuccessMsg}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs shadow-md shadow-amber-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig ? 'CONNECTING...' : 'SAVE & TEST CONNECTION'}
                  </button>

                  {status?.connected && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('browse')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
                    >
                      BROWSE MUSIC
                    </button>
                  )}
                </div>
              </form>

              {/* Instructions Guide */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                <p className="font-bold text-slate-300">How to find your Plex Token:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Open Plex Web in your browser (e.g. at app.plex.tv/desktop).</li>
                  <li>Click the three dots (•••) on any song ➔ select "Get Info".</li>
                  <li>Click "View XML" in the lower left corner.</li>
                  <li>
                    Look at the address bar URL at the end: copy the value after{' '}
                    <code className="text-amber-300">X-Plex-Token=</code>.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
