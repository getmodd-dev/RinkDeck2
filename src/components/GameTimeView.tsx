import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Trophy,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Search,
  Upload,
  Sparkles,
  Music,
  Flame,
  Radio,
  SlidersHorizontal,
  Clock,
  ListMusic,
  Plus,
  Eye,
  EyeOff,
  Bell,
  Sliders,
  Check,
  RotateCcw,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import { Track, GoalButtonConfig } from '../types';
import { formatTime } from '../utils/audioController';
import {
  playGoalHorn,
  getCustomHornFileName,
  setCustomGoalHorn,
  clearCustomGoalHorn,
  initGoalHornAudio,
} from '../utils/goalHorn';

export interface GameTimeViewProps {
  tracks: Track[];
  currentTrackId?: string;
  currentTrack?: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  goalButtons: GoalButtonConfig[];
  activeTeamName?: string;
  teamsCount?: number;
  excludedTrackIds: string[];
  onToggleTrackExcluded: (trackId: string) => void;
  playHornOnPlayerSelect: boolean;
  onToggleHornOnPlayerSelect: (enabled: boolean) => void;
  onPlayTrack: (track: Track, startTime?: number) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onPanicMute?: () => void;
  onOpenGoalModal: () => void;
  onAddFiles?: (files: FileList) => void;
  onSwitchToStudioMode: () => void;
}

export default function GameTimeView({
  tracks,
  currentTrackId,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  goalButtons,
  activeTeamName,
  teamsCount,
  excludedTrackIds,
  onToggleTrackExcluded,
  playHornOnPlayerSelect,
  onToggleHornOnPlayerSelect,
  onPlayTrack,
  onTogglePlay,
  onStop,
  onNextTrack,
  onPrevTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onPanicMute,
  onOpenGoalModal,
  onAddFiles,
  onSwitchToStudioMode,
}: GameTimeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistFilter, setPlaylistFilter] = useState<'all' | 'included' | 'excluded'>('all');
  const [lastGoalFired, setLastGoalFired] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hornFileInputRef = useRef<HTMLInputElement>(null);

  // Custom Horn state
  const [customHornName, setCustomHornName] = useState<string | null>(getCustomHornFileName());
  const [isHornDrawerOpen, setIsHornDrawerOpen] = useState(false);
  const [hornNotice, setHornNotice] = useState<string | null>(null);

  useEffect(() => {
    initGoalHornAudio().then((name) => setCustomHornName(name));
  }, []);

  // Time clock
  const [clockTime, setClockTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map athlete buttons to track IDs for quick badges in the playlist
  const athleteTrackMap = useMemo(() => {
    const map = new Map<string, GoalButtonConfig[]>();
    goalButtons.forEach((btn) => {
      if (btn.trackId) {
        const existing = map.get(btn.trackId) || [];
        existing.push(btn);
        map.set(btn.trackId, existing);
      }
    });
    return map;
  }, [goalButtons]);

  // Unified single playlist filtering
  const filteredPlaylist = useMemo(() => {
    let list = tracks;

    // Apply Included vs Excluded filter
    if (playlistFilter === 'included') {
      list = list.filter((t) => !excludedTrackIds.includes(t.id));
    } else if (playlistFilter === 'excluded') {
      list = list.filter((t) => excludedTrackIds.includes(t.id));
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const artistMatch = t.artist.toLowerCase().includes(q);
        const albumMatch = t.album && t.album.toLowerCase().includes(q);
        // Also match athlete numbers or names assigned to this track
        const athletes = athleteTrackMap.get(t.id);
        const athleteMatch = athletes?.some(
          (a) => a.number.includes(q) || a.athleteName.toLowerCase().includes(q)
        );
        return titleMatch || artistMatch || albumMatch || athleteMatch;
      });
    }

    return list;
  }, [tracks, playlistFilter, searchQuery, excludedTrackIds, athleteTrackMap]);

  const includedCount = useMemo(
    () => tracks.filter((t) => !excludedTrackIds.includes(t.id)).length,
    [tracks, excludedTrackIds]
  );
  const excludedCount = excludedTrackIds.length;

  // Trigger Goal action from the BIG Goal Button
  // NOTE: User requested: "I dont want the horn to sound when I select 'goal'"
  const handleBigGoalClick = () => {
    // Open Goal Soundboard popup cleanly WITHOUT sounding the horn!
    onOpenGoalModal();
  };

  // Custom Horn upload
  const handleHornUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const name = await setCustomGoalHorn(file);
      setCustomHornName(name);
      setHornNotice(`Custom horn loaded: ${file.name}`);
      setTimeout(() => setHornNotice(null), 4000);
    } catch (err) {
      console.error('Custom horn upload failed:', err);
    }
  };

  const handleClearHorn = async () => {
    await clearCustomGoalHorn();
    setCustomHornName(null);
    setHornNotice('Reset to built-in stadium synth horn');
    setTimeout(() => setHornNotice(null), 4000);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddFiles) {
      onAddFiles(e.target.files);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={hornFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
        className="hidden"
        onChange={handleHornUpload}
      />

      {/* Top Streamlined Game Time Header */}
      <header className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between shrink-0 z-10 gap-2">
        {/* Left: RinkDeck Game Time Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-300 font-mono text-xs font-black tracking-wider shadow-sm shadow-rose-900/40">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>⚡ RINKDECK &bull; GAME TIME</span>
          </div>
          <span className="hidden md:inline text-xs text-slate-400 font-mono">
            HOCKEY ARENA AUDIO
          </span>
        </div>

        {/* Center: High-Contrast Clock & Volume Slider */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-slate-100 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 shadow-sm">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>{clockTime || '00:00:00'}</span>
          </div>

          {/* Quick Volume Slider */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={onPanicMute || onToggleMute}
              title={isMuted ? 'Muted — Click to unmute' : 'Mute audio'}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>

        {/* Right: Switch Mode to Studio / Deck */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToStudioMode}
            title="Switch to Full Studio & Cue Editor"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono transition-all active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">FULL</span> STUDIO
          </button>
        </div>
      </header>

      {/* Goal Celebration Alert Flash */}
      {lastGoalFired && (
        <div className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 py-1.5 px-4 text-center text-white font-black text-xs sm:text-sm tracking-widest uppercase shadow-md animate-pulse flex items-center justify-center gap-2 shrink-0">
          <Radio className="w-4 h-4 animate-spin" />
          <span>{lastGoalFired}</span>
          <Radio className="w-4 h-4 animate-spin" />
        </div>
      )}

      {/* Main Game Time Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: BIG GOAL BUTTON, HORN TOGGLE & PRIMARY TRANSPORT CONTROLS */}
        <div className="lg:col-span-5 flex flex-col gap-3 justify-between min-h-0">
          {/* 1. THE BIG BUTTON FOR GOAL (Opens 20 athlete buttons; NO horn sound on tap) */}
          <div className="flex-1 flex flex-col min-h-[170px] sm:min-h-[200px]">
            <button
              id="btn-big-goal"
              type="button"
              onClick={handleBigGoalClick}
              title="Open 20 Athlete Celebration Songs"
              className="w-full flex-1 rounded-3xl bg-gradient-to-b from-rose-600 via-rose-700 to-red-900 hover:from-rose-500 hover:to-red-800 active:scale-[0.98] border-4 border-rose-400/80 shadow-[0_0_35px_rgba(225,29,72,0.45)] hover:shadow-[0_0_50px_rgba(225,29,72,0.6)] flex flex-col items-center justify-center p-4 text-white transition-all cursor-pointer relative overflow-hidden group select-none"
            >
              <div className="absolute inset-0 bg-radial from-rose-400/30 to-transparent pointer-events-none animate-pulse" />

              <div className="flex items-center gap-3 relative z-10 mb-1">
                <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 animate-bounce" />
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-wider drop-shadow-md">
                  GOAL!
                </span>
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 animate-bounce" />
              </div>

              <div className="relative z-10 flex items-center gap-2 mt-1">
                <span className="px-3.5 py-1 rounded-full bg-slate-950/70 border border-white/25 text-white font-mono font-bold text-xs sm:text-sm tracking-wide">
                  {activeTeamName ? `${activeTeamName.toUpperCase()} • 20 ATHLETES` : '20 ATHLETE CELEBRATIONS'}
                </span>
                {teamsCount && teamsCount > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-400/40 text-rose-200 font-mono text-[10px] font-bold">
                    {teamsCount} TEAMS
                  </span>
                )}
              </div>

              <div className="text-[11px] text-rose-200/90 font-mono mt-2 relative z-10">
                Tap to open team pages &amp; player celebration soundboard
              </div>
            </button>
          </div>

          {/* HORN CONTROLS STRIP: Horn Toggle on Player & Custom Horn Setup */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
            {/* Horn with Player Select Toggle */}
            <button
              id="btn-toggle-horn-on-player-gametime"
              type="button"
              onClick={() => onToggleHornOnPlayerSelect(!playHornOnPlayerSelect)}
              title="Toggle whether the arena horn blasts when selecting an athlete celebration"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
                playHornOnPlayerSelect
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className={`w-4 h-4 ${playHornOnPlayerSelect ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
              <span>HORN W/ PLAYER:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                  playHornOnPlayerSelect ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {playHornOnPlayerSelect ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Custom Horn Audio File Selector & Test Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsHornDrawerOpen(!isHornDrawerOpen)}
                title="Configure Horn Sound File (Custom or Built-in Synth)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] font-bold truncate max-w-[90px]">
                  {customHornName ? 'CUSTOM HORN' : 'SYNTH HORN'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => playGoalHorn()}
                title="Audition / Blast Arena Horn"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold border border-amber-500/40 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>TEST</span>
              </button>
            </div>

            {/* Expandable Custom Horn File Drawer */}
            {isHornDrawerOpen && (
              <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 animate-fade-in text-xs">
                <div className="text-[11px] font-mono text-slate-400">
                  Current Horn:{' '}
                  <span className="text-amber-300 font-bold">
                    {customHornName || 'Built-in Stadium Synthesizer'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => hornFileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold active:scale-95 text-[11px]"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Custom File</span>
                  </button>

                  {customHornName && (
                    <button
                      type="button"
                      onClick={handleClearHorn}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {hornNotice && (
                  <div className="w-full text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {hornNotice}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. THE 3 PRIMARY CONTROLS: STOP, PLAY/PAUSE, NEXT TRACK */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col gap-3 shadow-xl">
            {/* Now Playing Mini Display */}
            <div className="flex items-center justify-between px-1">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>ARENA AUDIO PLAYBACK</span>
                  {currentTrack && excludedTrackIds.includes(currentTrack.id) && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                      EXCLUDED FROM QUEUE
                    </span>
                  )}
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                  {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                  <span>{currentTrack?.title || 'No Song Playing'}</span>
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {currentTrack?.artist || 'Ready'}
                </div>
              </div>

              {/* Time display */}
              <div className="text-right font-mono text-xs sm:text-sm shrink-0 pl-2">
                <span className="font-bold text-slate-100">{formatTime(currentTime)}</span>
                <span className="text-slate-500"> / {formatTime(duration || currentTrack?.duration || 0)}</span>
              </div>
            </div>

            {/* Simple Scrubber Bar */}
            <div className="w-full flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration || currentTrack?.duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* THE PRIMARY PLAYBACK & EMERGENCY CONTROLS */}
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5 pt-1">
              {/* EMERGENCY PANIC MUTE BUTTON */}
              <button
                id="btn-gametime-panic-mute"
                type="button"
                onClick={onPanicMute || onToggleMute}
                title="EMERGENCY PANIC MUTE: Instantly cut all audio output and horn"
                className={`h-16 sm:h-20 rounded-2xl font-mono font-black text-xs sm:text-sm border-2 shadow-lg active:scale-95 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none relative overflow-hidden ${
                  isMuted
                    ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 text-slate-950 border-amber-300 shadow-amber-500/50 animate-pulse'
                    : 'bg-gradient-to-b from-amber-700 via-rose-900 to-slate-950 text-amber-200 border-amber-500/60 hover:border-amber-400 hover:from-amber-600 shadow-red-950/60'
                }`}
              >
                <div className="flex items-center gap-1">
                  <AlertOctagon className={`w-5 h-5 sm:w-6 sm:h-6 ${isMuted ? 'text-slate-950 fill-current' : 'text-amber-400 animate-pulse'}`} />
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="tracking-tighter uppercase font-black text-[11px] sm:text-xs">
                  {isMuted ? 'MUTED' : 'PANIC'}
                </span>
                <span className="text-[9px] opacity-80 -mt-0.5 tracking-wider">
                  {isMuted ? 'TAP TO RESTORE' : 'MUTE ALL'}
                </span>
              </button>

              {/* STOP BUTTON (Large Red - Immediate Silence for Whistle/Referee) */}
              <button
                id="btn-gametime-stop"
                type="button"
                onClick={onStop}
                title="Stop Audio (Immediate Silence for Referees)"
                className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-red-600 to-rose-900 hover:from-red-500 hover:to-rose-800 active:scale-95 text-white font-mono font-black text-xs sm:text-sm border-2 border-red-400/60 shadow-lg shadow-red-950/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none"
              >
                <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                <span>STOP</span>
                <span className="text-[9px] text-red-200/80 -mt-0.5">WHISTLE</span>
              </button>

              {/* PLAY / PAUSE BUTTON (Large Green - Resume / Pause) */}
              <button
                id="btn-gametime-play"
                type="button"
                onClick={onTogglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 active:scale-95 text-white font-mono font-black text-xs sm:text-sm border-2 border-emerald-400/60 shadow-lg shadow-emerald-950/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    <span>PAUSE</span>
                    <span className="text-[9px] text-emerald-200/80 -mt-0.5">HOLD</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" />
                    <span>PLAY</span>
                    <span className="text-[9px] text-emerald-200/80 -mt-0.5">RESUME</span>
                  </>
                )}
              </button>

              {/* NEXT TRACK BUTTON (Large Blue - Advance Stoppage Music) */}
              <button
                id="btn-gametime-next"
                type="button"
                onClick={onNextTrack}
                title="Next Track (Skips Excluded Songs)"
                className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-sky-600 to-blue-900 hover:from-sky-500 hover:to-blue-800 active:scale-95 text-white font-mono font-black text-xs sm:text-sm border-2 border-sky-400/60 shadow-lg shadow-sky-950/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                <span>NEXT</span>
                <span className="text-[9px] text-sky-200/80 -mt-0.5">QUEUE</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SINGLE UNIFIED PLAYLIST WITH EXCLUDE / INCLUDE TOGGLES */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col shadow-xl overflow-hidden min-h-0">
          {/* Header Bar: Filter Options & Add Files */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2 gap-2 flex-wrap shrink-0">
            {/* Filter Pills for Unified Playlist */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setPlaylistFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  playlistFilter === 'all'
                    ? 'bg-slate-200 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>ALL ({tracks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPlaylistFilter('included')}
                title="Songs active in normal queue rotation"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  playlistFilter === 'included'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>IN PLAYLIST ({includedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setPlaylistFilter('excluded')}
                title="Songs excluded from regular queue rotation (goal songs, specialty cues)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  playlistFilter === 'excluded'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>EXCLUDED ({excludedCount})</span>
              </button>
            </div>

            {/* Quick Upload / Add Audio */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Add MP3/WAV Audio Files"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Add Files</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-2.5 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playlist by song, artist, or athlete (#97)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-rose-500/60"
            />
          </div>

          {/* Unified Playlist Track List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {filteredPlaylist.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 font-mono">
                {playlistFilter === 'excluded'
                  ? 'No tracks are currently excluded from the playlist rotation.'
                  : `No songs matched "${searchQuery}"`}
              </div>
            ) : (
              filteredPlaylist.map((track, idx) => {
                const isCurrent = isPlaying && currentTrackId === track.id;
                const isExcluded = excludedTrackIds.includes(track.id);
                const assignedAthletes = athleteTrackMap.get(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() => onPlayTrack(track, 0)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] select-none ${
                      isCurrent
                        ? 'bg-rose-950/70 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                        : isExcluded
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:bg-slate-900/60'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Track Index & Title/Artist */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs border shrink-0 ${
                          isCurrent
                            ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                            : isExcluded
                            ? 'bg-slate-900/60 text-slate-500 border-slate-800'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        {isCurrent ? <Play className="w-4 h-4 fill-current" /> : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm truncate ${
                              isCurrent ? 'text-white' : isExcluded ? 'text-slate-300' : 'text-slate-100'
                            }`}
                          >
                            {track.title}
                          </span>

                          {/* Excluded Badge */}
                          {isExcluded && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[9px] font-bold">
                              EXCLUDED
                            </span>
                          )}

                          {/* Athlete Badge if assigned */}
                          {assignedAthletes && assignedAthletes.length > 0 && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[9px] font-bold">
                              #{assignedAthletes[0].number} {assignedAthletes[0].athleteName}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                          <span>{track.artist}</span>
                          <span>&bull;</span>
                          <span className="font-mono">{formatTime(track.duration)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Exclude/Include Toggle & Direct Play) */}
                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      {/* Exclude / Include from Playlist Rotation Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTrackExcluded(track.id);
                        }}
                        title={
                          isExcluded
                            ? 'Restore to Playlist Queue / Rotation'
                            : 'Exclude from Queue Rotation (will only play on manual trigger)'
                        }
                        className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                          isExcluded
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
                        }`}
                      >
                        {isExcluded ? (
                          <>
                            <Plus className="w-3 h-3 text-amber-400" />
                            <span className="hidden sm:inline">INCLUDE</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span className="hidden sm:inline">EXCLUDE</span>
                          </>
                        )}
                      </button>

                      {/* Play Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack(track, 0);
                        }}
                        title="Play Track Now"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
