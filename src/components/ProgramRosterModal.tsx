import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Check,
  Music,
  Upload,
  RotateCcw,
  Play,
  Trophy,
  Search,
  Trash2,
  Plus,
} from 'lucide-react';
import { Track, GoalButtonConfig, TeamGoalSoundboard } from '../types';
import {
  playGoalHorn,
  getCustomHornFileName,
  setCustomGoalHorn,
  clearCustomGoalHorn,
  initGoalHornAudio,
} from '../utils/goalHorn';

interface ProgramRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamGoalSoundboard[];
  activeTeamId: string;
  tracks: Track[];
  onSaveTeams: (teams: TeamGoalSoundboard[]) => void;
  onSelectTeam: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onAddTeam?: () => void;
}

export default function ProgramRosterModal({
  isOpen,
  onClose,
  teams,
  activeTeamId,
  tracks,
  onSaveTeams,
  onSelectTeam,
  onDeleteTeam,
  onAddTeam,
}: ProgramRosterModalProps) {
  const [selectedButtonId, setSelectedButtonId] = useState<number>(1);
  const [songSearch, setSongSearch] = useState<string>('');
  const [hornFileName, setHornFileName] = useState<string | null>(getCustomHornFileName());
  const [hornMessage, setHornMessage] = useState<string | null>(null);
  const hornFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    initGoalHornAudio().then((name) => setHornFileName(name));
  }, []);

  if (!isOpen) return null;

  const currentTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const activeBtn = currentTeam.buttons.find((b) => b.id === selectedButtonId) || currentTeam.buttons[0];

  // Atomically update any fields of the active athlete button without stale closures
  const handleUpdateBtn = (patch: Partial<GoalButtonConfig>) => {
    const updatedButtons = currentTeam.buttons.map((b) =>
      b.id === activeBtn.id ? { ...b, ...patch } : b
    );
    const updatedTeams = teams.map((t) =>
      t.id === currentTeam.id ? { ...t, buttons: updatedButtons } : t
    );
    onSaveTeams(updatedTeams);
  };

  // Assign a track to the active button
  const handleAssignTrack = (t: Track) => {
    handleUpdateBtn({
      trackId: t.id,
      trackTitle: t.title,
      artist: t.artist,
    });
  };

  // Clear assigned track
  const handleClearTrack = () => {
    handleUpdateBtn({
      trackId: undefined,
      trackTitle: undefined,
      artist: undefined,
    });
  };

  // Update Team Name
  const handleUpdateTeamName = (name: string) => {
    const updatedTeams = teams.map((t) =>
      t.id === currentTeam.id ? { ...t, name } : t
    );
    onSaveTeams(updatedTeams);
  };

  // Handle custom horn upload
  const handleHornUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const name = await setCustomGoalHorn(file);
      setHornFileName(name);
      setHornMessage(`Goal Horn saved to /app/data: ${name}`);
      setTimeout(() => setHornMessage(null), 3000);
    } catch {
      setHornMessage('Failed to save horn file');
    }
  };

  const handleResetHorn = async () => {
    await clearCustomGoalHorn();
    setHornFileName(null);
    setHornMessage('Reset to Stadium Synthesizer horn');
    setTimeout(() => setHornMessage(null), 3000);
  };

  const filteredModalTracks = tracks.filter((t) => {
    if (!songSearch.trim()) return true;
    const q = songSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q)
    );
  });

  const hasAssignedSong = Boolean(activeBtn.trackId || activeBtn.trackTitle);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-4xl h-[90vh] max-h-[720px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">ROSTER PROGRAMMER</h2>
              <p className="text-xs text-slate-400 font-mono">Assign celebration songs & jersey numbers (Stored in /app/data)</p>
            </div>
          </div>

          {/* Large Tactile Exit / Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 active:scale-95 text-slate-200 hover:text-white border-2 border-slate-700 hover:border-rose-500/70 transition-all cursor-pointer shadow-md group shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs font-black font-mono tracking-wide text-white">DONE</span>
              <span className="text-[9px] font-mono text-slate-400 group-hover:text-rose-300">BACK TO RINK</span>
            </div>
            <X className="w-4 h-4 text-slate-400 group-hover:text-white ml-0.5" />
          </button>
        </div>

        {/* Team Selector & Horn Settings Sub-Bar */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Team Switcher & Name Input */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-mono text-[11px]">ACTIVE TEAM:</span>
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeam(t.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    t.id === currentTeam.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              {onAddTeam && (
                <button
                  type="button"
                  onClick={onAddTeam}
                  title="Add New Team Roster"
                  className="px-2 py-1 rounded text-xs font-mono font-bold text-sky-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>NEW</span>
                </button>
              )}
            </div>

            <input
              type="text"
              value={currentTeam.name}
              onChange={(e) => handleUpdateTeamName(e.target.value)}
              placeholder="Team Name"
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono w-32 focus:outline-none focus:border-rose-500"
            />

            {teams.length > 1 && onDeleteTeam && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete team roster "${currentTeam.name}"? This removes all 20 assigned player buttons for this team.`)) {
                    onDeleteTeam(currentTeam.id);
                  }
                }}
                title={`Delete team "${currentTeam.name}"`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-600/40 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE TEAM</span>
              </button>
            )}
          </div>

          {/* Goal Horn Sound Customizer */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={hornFileInputRef}
              onChange={handleHornUpload}
              accept="audio/*,.mp3,.wav,.flac"
              className="hidden"
            />
            <span className="text-slate-400 font-mono text-[11px]">ARENA HORN:</span>
            <button
              type="button"
              onClick={() => hornFileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs cursor-pointer"
            >
              <Upload className="w-3 h-3 text-sky-400" />
              <span>{hornFileName ? 'Change Horn File' : 'Upload Horn'}</span>
            </button>

            {hornFileName && (
              <button
                type="button"
                onClick={handleResetHorn}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                title="Reset to default synth horn"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => playGoalHorn()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 font-mono text-xs font-bold cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>TEST</span>
            </button>
          </div>
        </div>

        {hornMessage && (
          <div className="bg-emerald-950/80 text-emerald-300 text-xs font-mono px-4 py-1 text-center border-b border-emerald-500/30">
            {hornMessage}
          </div>
        )}

        {/* Main 2-Column Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left: 20 Athlete Buttons Picker (5 cols) */}
          <div className="md:col-span-5 border-r border-slate-800 p-3 overflow-y-auto bg-slate-950/40">
            <div className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
              Select Player Button (1 to 20)
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {currentTeam.buttons.map((btn) => {
                const isSelected = btn.id === activeBtn.id;
                const hasSong = Boolean(btn.trackId || btn.trackTitle);

                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setSelectedButtonId(btn.id)}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between h-16 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-white shadow-lg ring-2 ring-rose-400'
                        : hasSong
                        ? 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-950 text-slate-500 border-slate-800/80'
                    }`}
                  >
                    <span className="font-mono font-black text-base leading-none">
                      #{btn.number}
                    </span>
                    <span className="text-[10px] truncate leading-tight font-bold">
                      {btn.athleteName || `Player #${btn.number}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Player Editor (7 cols) */}
          <div className="md:col-span-7 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono text-rose-400">
                  #{activeBtn.number}
                </span>
                <span className="text-base font-bold text-white">
                  {activeBtn.athleteName || `Player #${activeBtn.number}`}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                BUTTON #{activeBtn.id} of 20
              </span>
            </div>

            {/* Jersey Number & Name Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Jersey Number
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={activeBtn.number}
                  onChange={(e) => handleUpdateBtn({ number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Player / Athlete Name
                </label>
                <input
                  type="text"
                  value={activeBtn.athleteName}
                  onChange={(e) => handleUpdateBtn({ athleteName: e.target.value })}
                  placeholder="e.g. McDavid, Crosby"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Cue Offset (Start at Chorus) */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Start Cue Offset (seconds into song for chorus/drop)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={activeBtn.startTime || 0}
                  onChange={(e) =>
                    handleUpdateBtn({
                      startTime: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-28 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white font-bold focus:outline-none focus:border-rose-500"
                />
                <span className="text-xs font-mono text-slate-400">
                  Starts at: {Math.floor((activeBtn.startTime || 0) / 60)}:
                  {String((activeBtn.startTime || 0) % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Currently Assigned Goal Song Card */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Assigned Goal Celebration Song
              </label>
              {hasAssignedSong ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/40 border border-rose-500/50">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {activeBtn.trackTitle}
                      </div>
                      <div className="text-xs text-rose-300 truncate">
                        {activeBtn.artist || 'Goal Celebration Track'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearTrack}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>REMOVE</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono">
                  No song assigned. Choose a song below to assign to #{activeBtn.number} {activeBtn.athleteName}.
                </div>
              )}
            </div>

            {/* Search and Song Selection List */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-slate-400">
                  Select Song from Library ({tracks.length} available)
                </span>
              </div>

              {/* Search Bar in Modal */}
              <div className="relative mb-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search songs to assign..."
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Scrollable Song List */}
              <div className="flex-1 border border-slate-800 rounded-xl bg-slate-950/60 overflow-y-auto max-h-52 p-1 space-y-1">
                {filteredModalTracks.length === 0 ? (
                  <div className="p-4 text-center text-xs font-mono text-slate-500">
                    No songs match &quot;{songSearch}&quot;
                  </div>
                ) : (
                  filteredModalTracks.map((t) => {
                    const isAssigned =
                      activeBtn.trackId === t.id ||
                      (activeBtn.trackTitle && activeBtn.trackTitle === t.title);

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleAssignTrack(t)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-all ${
                          isAssigned
                            ? 'bg-rose-600 text-white border-white font-bold shadow-sm'
                            : 'bg-slate-900/80 text-slate-200 border-slate-800 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="truncate min-w-0 pr-2">
                          <span className="truncate">{t.title}</span>
                          <span className="text-[11px] opacity-75 ml-2">
                            ({t.artist})
                          </span>
                        </div>
                        {isAssigned ? (
                          <div className="flex items-center gap-1 font-mono text-[10px] bg-white text-rose-600 px-1.5 py-0.5 rounded font-black shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            <span>ASSIGNED</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 opacity-60 group-hover:opacity-100 shrink-0">
                            TAP TO ASSIGN
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
