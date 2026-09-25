import React, { useRef, useState } from 'react';
import {
  Track,
  TrackMemory,
  ShuffleMode,
} from '../types';
import { formatTime } from '../utils/audioController';
import {
  FolderPlus,
  FileAudio,
  Shuffle,
  Sparkles,
  Search,
  X,
  Play,
  Bookmark,
  Trash2,
  ListMusic,
  CheckCircle2,
  Flag,
  EyeOff,
  Eye,
  Plus,
} from 'lucide-react';

interface PlaylistQueueViewProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  shuffleMode: ShuffleMode;
  queueOrder: string[]; // Track IDs in play order
  trackMemories: Record<string, TrackMemory>;
  excludedTrackIds?: string[];
  onToggleTrackExcluded?: (trackId: string) => void;
  onSelectTrack: (track: Track) => void;
  onAddFiles: (files: FileList) => void;
  onReshuffle: () => void;
  onClearTrackMemory: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
}

export default function PlaylistQueueView({
  tracks,
  currentTrackId,
  isPlaying,
  shuffleMode,
  queueOrder,
  trackMemories,
  excludedTrackIds = [],
  onToggleTrackExcluded,
  onSelectTrack,
  onAddFiles,
  onReshuffle,
  onClearTrackMemory,
  onRemoveTrack,
}: PlaylistQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Map tracks by ID for fast lookup
  const trackMap = new Map<string, Track>();
  tracks.forEach((t) => trackMap.set(t.id, t));

  // Determine displayed list
  const baseList: Track[] =
    activeTab === 'queue' && queueOrder.length > 0
      ? queueOrder.map((id) => trackMap.get(id)).filter(Boolean) as Track[]
      : tracks;

  // Filter by search
  const filteredTracks = baseList.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      (t.genre && t.genre.toLowerCase().includes(q))
    );
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileChange}
        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        multiple
        className="hidden"
      />

      {/* Header bar: Tabs & Action buttons (Large touch targets) */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* View Switcher: Active Queue vs Full Library */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              activeTab === 'queue'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            <span>PLAY QUEUE</span>
            {shuffleMode !== 'off' && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-sky-950/40 text-slate-950 font-mono">
                SHUFFLED
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              activeTab === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>ALL TRACKS</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {tracks.length}
            </span>
          </button>
        </div>

        {/* Action buttons: Reshuffle & Add Media */}
        <div className="flex items-center gap-2">
          {/* Quick Reshuffle button */}
          {shuffleMode !== 'off' && (
            <button
              id="btn-reshuffle-playlist"
              type="button"
              onClick={onReshuffle}
              title="Re-randomize upcoming tracks queue"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 active:scale-95 text-sky-300 border border-sky-600/40 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>RESHUFFLE</span>
            </button>
          )}

          {/* Add Local Files Button */}
          <button
            id="btn-add-local-audio"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Add audio files from Raspberry Pi local drive or USB"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <FileAudio className="w-4 h-4 text-sky-400" />
            <span>+ ADD FILES</span>
          </button>

          {/* Add Folder Button */}
          <button
            id="btn-add-folder"
            type="button"
            onClick={() => folderInputRef.current?.click()}
            title="Add entire music folder from Pi"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>FOLDER</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-950/20">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search titles, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Track List (Touch-scrollable with 56px minimum list item heights) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
        {filteredTracks.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
            <FileAudio className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No audio tracks found</p>
            <p className="text-[11px] mt-1">Tap "+ Add Files" or drag local audio files here</p>
          </div>
        ) : (
          filteredTracks.map((track, index) => {
            const isCurrent = track.id === currentTrackId;
            const isExcluded = excludedTrackIds.includes(track.id);
            const memory = trackMemories[track.id];
            const hasMemory = memory && memory.position > 3 && !memory.completed;

            return (
              <div
                key={`${track.id}-${index}`}
                onClick={() => onSelectTrack(track)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] select-none ${
                  isCurrent
                    ? 'bg-sky-950/40 border border-sky-500/40 shadow-sm text-sky-200'
                    : isExcluded
                    ? 'opacity-60 hover:opacity-90 bg-slate-950/40 text-slate-400 border border-transparent'
                    : 'hover:bg-slate-800/40 text-slate-300 border border-transparent'
                }`}
              >
                {/* Left: Index / Status & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Track Number or Playing Indicator */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-slate-400 bg-slate-800/60 shrink-0">
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
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Album Cover color pip */}
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 shadow-inner flex items-center justify-center font-bold text-[10px] text-white"
                    style={{ backgroundColor: track.coverColor || '#38bdf8' }}
                  >
                    {track.title.slice(0, 1).toUpperCase()}
                  </div>

                  {/* Title & Artist & Format */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-semibold truncate ${isCurrent ? 'text-sky-300 font-bold' : isExcluded ? 'text-slate-400' : 'text-slate-100'}`}>
                        {track.title}
                      </span>
                      {isExcluded && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono shrink-0">
                          EXCLUDED
                        </span>
                      )}
                      {track.isLocalFile && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono shrink-0">
                          LOCAL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                      <span className="truncate">{track.artist}</span>
                      <span>•</span>
                      <span className="text-slate-500 truncate">{track.album}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Preset Cue Range, Position Memory Pill & Duration & Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Preset Cue Range Pill (In ➔ Out) */}
                  {((memory?.startPoint !== undefined && memory.startPoint > 0) ||
                    (track.presetStart !== undefined && track.presetStart > 0) ||
                    (memory?.endPoint !== undefined && memory.endPoint < track.duration) ||
                    (track.presetEnd !== undefined && track.presetEnd < track.duration)) && (
                    <div
                      className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/40 text-emerald-300"
                      title={`Preset Location: Start @ ${formatTime(memory?.startPoint ?? track.presetStart ?? 0)}, End @ ${formatTime(memory?.endPoint ?? track.presetEnd ?? track.duration)}`}
                    >
                      <Flag className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{formatTime(memory?.startPoint ?? track.presetStart ?? 0)}</span>
                      <span className="text-emerald-500">➔</span>
                      <span>{formatTime(memory?.endPoint ?? track.presetEnd ?? track.duration)}</span>
                    </div>
                  )}

                  {/* Start Position Memory Pill */}
                  {hasMemory && (
                    <div
                      className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-600/40 text-amber-300 shadow-sm"
                      title={`Memory position: ${formatTime(memory.position)}. Click to clear memory.`}
                    >
                      <Bookmark className="w-3 h-3 fill-current text-amber-400" />
                      <span>{formatTime(memory.position)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearTrackMemory(track.id);
                        }}
                        className="ml-1 text-slate-400 hover:text-amber-200 p-0.5"
                        title="Clear saved memory for this track"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Completed Checkmark if previously finished */}
                  {memory?.completed && (
                    <span title="Played to end">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
                    </span>
                  )}

                  {/* Duration */}
                  <span className="text-xs font-mono text-slate-400">
                    {formatTime(track.duration)}
                  </span>

                  {/* Exclude / Include from Playlist Rotation Button */}
                  {onToggleTrackExcluded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTrackExcluded(track.id);
                      }}
                      title={
                        isExcluded
                          ? 'Restore to Playlist Queue Rotation'
                          : 'Exclude from Queue Rotation (play manually or as goal song)'
                      }
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        isExcluded
                          ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/50'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {isExcluded ? <Plus className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Delete / Remove (for uploaded local tracks or custom list) */}
                  {track.isLocalFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      title="Remove track"
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] font-mono text-slate-400 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span>{filteredTracks.length} tracks in queue</span>
          <span>•</span>
          <span>
            {formatTime(filteredTracks.reduce((acc, t) => acc + t.duration, 0))} total
          </span>
        </div>
        <div className="flex items-center gap-1 text-sky-400">
          <Shuffle className="w-3.5 h-3.5" />
          <span>MODE: {shuffleMode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
