import React, { useState, useMemo, useRef, memo } from 'react';
import {
  Search,
  Plus,
  Play,
  Pause,
  Eye,
  EyeOff,
  Trash2,
  ListMusic,
  Music,
} from 'lucide-react';
import { Track, GoalButtonConfig } from '../types';
import { formatTime } from '../utils/audioController';

interface ArenaPlaylistProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  excludedTrackIds: string[];
  goalButtons: GoalButtonConfig[];
  onSelectTrack: (track: Track) => void;
  onToggleTrackExcluded: (trackId: string) => void;
  onAddFiles: (files: FileList) => void;
  onRemoveTrack: (trackId: string) => void;
  onClearDefaultTracks?: () => void;
}

// Memoized Track Row for butter-smooth scrolling and zero wasted re-renders
const PlaylistRow = memo(function PlaylistRow({
  track,
  index,
  isCurrent,
  isPlaying,
  isExcluded,
  assignedAthlete,
  onSelect,
  onToggleExcluded,
  onRemove,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isExcluded: boolean;
  assignedAthlete?: GoalButtonConfig;
  onSelect: () => void;
  onToggleExcluded: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
        isCurrent
          ? 'bg-sky-950/70 border-sky-500/60 shadow-md'
          : isExcluded
          ? 'bg-slate-950/40 hover:bg-slate-900/60 border-slate-800/40 text-slate-400'
          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-200'
      }`}
    >
      {/* Left: Index / Play Icon & Track Details */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        {/* Play Icon / Track Number */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold bg-slate-800/80 shrink-0">
          {isCurrent ? (
            isPlaying ? (
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-sky-400 h-full animate-pulse" />
                <span className="w-1 bg-sky-400 h-2/3 animate-pulse delay-75" />
                <span className="w-1 bg-sky-400 h-4/5 animate-pulse delay-150" />
              </div>
            ) : (
              <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
            )
          ) : (
            <span className="text-slate-400">{index + 1}</span>
          )}
        </div>

        {/* Title, Artist, and Badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs sm:text-sm font-semibold truncate ${
                isCurrent ? 'text-sky-300 font-bold' : isExcluded ? 'text-slate-400' : 'text-slate-100'
              }`}
            >
              {track.title}
            </span>

            {/* Assigned Athlete Badge */}
            {assignedAthlete && (
              <span className="px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono font-bold text-[9px] shrink-0">
                #{assignedAthlete.number} {assignedAthlete.athleteName}
              </span>
            )}

            {/* Excluded Tag */}
            {isExcluded && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono shrink-0">
                GOAL ONLY
              </span>
            )}

            {track.isLocalFile && (
              <span className="px-1 py-0.2 rounded bg-slate-800 text-emerald-400 text-[9px] font-mono shrink-0">
                LOCAL
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 truncate">
            {track.artist}
            {track.album ? ` • ${track.album}` : ''}
          </div>
        </div>
      </div>

      {/* Right: Duration & Quick Actions (Exclude, Delete) */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-mono text-slate-400 mr-1">
          {formatTime(track.duration)}
        </span>

        {/* Rotation Toggle Button */}
        <button
          type="button"
          onClick={onToggleExcluded}
          title={
            isExcluded
              ? 'Excluded: Tap to include back in normal arena rotation'
              : 'Included in rotation: Tap to make this song goal-only'
          }
          className={`p-1.5 rounded-lg border transition-all ${
            isExcluded
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-400 hover:bg-amber-900/60'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          {isExcluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Delete Track Button */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title={track.source === 'demo' ? 'Remove default demo track' : 'Remove track from storage'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});

export default function ArenaPlaylist({
  tracks,
  currentTrackId,
  isPlaying,
  excludedTrackIds,
  goalButtons,
  onSelectTrack,
  onToggleTrackExcluded,
  onAddFiles,
  onRemoveTrack,
  onClearDefaultTracks,
}: ArenaPlaylistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'included' | 'excluded'>('all');
  const [sortField, setSortField] = useState<'default' | 'artist' | 'album' | 'title'>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if any default demo tracks remain
  const hasDemoTracks = useMemo(
    () => tracks.some((t) => t.source === 'demo' || t.id.startsWith('demo-')),
    [tracks]
  );

  // Map athlete buttons to track IDs for quick badges
  const athleteTrackMap = useMemo(() => {
    const map = new Map<string, GoalButtonConfig>();
    goalButtons.forEach((btn) => {
      if (btn.trackId) {
        map.set(btn.trackId, btn);
      }
    });
    return map;
  }, [goalButtons]);

  // Filter and sort tracks by filter tab, search query, and sortField
  const filteredTracks = useMemo(() => {
    let list = tracks;

    if (filterMode === 'included') {
      list = list.filter((t) => !excludedTrackIds.includes(t.id));
    } else if (filterMode === 'excluded') {
      list = list.filter((t) => excludedTrackIds.includes(t.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const artistMatch = t.artist.toLowerCase().includes(q);
        const albumMatch = t.album ? t.album.toLowerCase().includes(q) : false;
        const athlete = athleteTrackMap.get(t.id);
        const athleteMatch = athlete && (
          athlete.number.includes(q) ||
          athlete.athleteName.toLowerCase().includes(q)
        );
        return titleMatch || artistMatch || albumMatch || athleteMatch;
      });
    }

    if (sortField !== 'default') {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'artist') {
          cmp = (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' });
          if (cmp === 0) {
            cmp = (a.album || '').localeCompare(b.album || '', undefined, { sensitivity: 'base' });
          }
          if (cmp === 0) {
            cmp = (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
          }
        } else if (sortField === 'album') {
          cmp = (a.album || '').localeCompare(b.album || '', undefined, { sensitivity: 'base' });
          if (cmp === 0) {
            cmp = (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' });
          }
          if (cmp === 0) {
            cmp = (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
          }
        } else if (sortField === 'title') {
          cmp = (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
        }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [tracks, filterMode, searchQuery, sortField, sortDirection, excludedTrackIds, athleteTrackMap]);

  const includedCount = useMemo(
    () => tracks.filter((t) => !excludedTrackIds.includes(t.id)).length,
    [tracks, excludedTrackIds]
  );
  const excludedCount = excludedTrackIds.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800/90 overflow-hidden shadow-lg">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
        className="hidden"
      />

      {/* Playlist Top Toolbar: Search, Filters & Add Files */}
      <div className="p-2.5 border-b border-slate-800/90 bg-slate-950/70 flex flex-col gap-2 shrink-0 select-none">
        {/* Search Bar + Add Audio Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search songs, artists, or #players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import audio files from iPad or drive"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-mono font-bold text-xs shadow-md shadow-sky-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ADD MUSIC</span>
          </button>

          {hasDemoTracks && onClearDefaultTracks && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Remove all default synthesizer demo tracks? This leaves only your uploaded songs.')) {
                  onClearDefaultTracks();
                }
              }}
              title="Remove default demo audio tracks"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 active:scale-95 text-rose-300 hover:text-white font-mono font-bold text-xs border border-rose-600/40 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">REMOVE DEFAULTS</span>
              <span className="sm:hidden">DEFAULTS</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL ({tracks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('included')}
            className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterMode === 'included'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            IN ROTATION ({includedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('excluded')}
            className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterMode === 'excluded'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            GOAL ONLY ({excludedCount})
          </button>
        </div>

        {/* Sorting Bar */}
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono px-0.5 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-500 font-bold text-[10px]">SORT:</span>
            {(['default', 'artist', 'album', 'title'] as const).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => {
                  if (sortField === field && field !== 'default') {
                    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField(field);
                    setSortDirection('asc');
                  }
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                  sortField === field
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {field === 'default' ? 'DEFAULT' : field.toUpperCase()}
                {sortField === field && field !== 'default' && (
                  <span className="ml-1 text-[9px]">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-slate-500 shrink-0">
            {filteredTracks.length} song{filteredTracks.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
        {filteredTracks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <Music className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-mono">No matching songs found</p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-[11px] text-sky-400 underline font-mono"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredTracks.map((track, idx) => (
            <PlaylistRow
              key={track.id}
              track={track}
              index={idx}
              isCurrent={track.id === currentTrackId}
              isPlaying={isPlaying}
              isExcluded={excludedTrackIds.includes(track.id)}
              assignedAthlete={athleteTrackMap.get(track.id)}
              onSelect={() => onSelectTrack(track)}
              onToggleExcluded={() => onToggleTrackExcluded(track.id)}
              onRemove={() => onRemoveTrack(track.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
