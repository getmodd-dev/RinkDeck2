import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  X,
  Play,
  Square,
  Edit3,
  Volume2,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Radio,
  Music,
  Bell,
  Sliders,
  Users,
  Plus,
  Trash2,
  ChevronRight,
  Shield,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { Track, GoalButtonConfig, TeamGoalSoundboard } from '../types';
import {
  playGoalHorn,
  getCustomHornFileName,
  setCustomGoalHorn,
  clearCustomGoalHorn,
  initGoalHornAudio,
} from '../utils/goalHorn';

export const TEAMS_STORAGE_KEY = 'rinkdeck_goal_teams_v1';
export const ACTIVE_TEAM_STORAGE_KEY = 'rinkdeck_active_team_id';
export const LEGACY_BUTTONS_KEY = 'ipad_goal_buttons_v1';

export const DEFAULT_JERSEY_NUMBERS = [
  '07', '08', '09', '10', '11', '13', '17', '19', '21', '23',
  '29', '34', '68', '71', '77', '87', '88', '91', '97', '99',
];

export function createBlankTeamButtons(
  _teamName: string = 'Team',
  color: string = 'rose'
): GoalButtonConfig[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    number: DEFAULT_JERSEY_NUMBERS[i] || String(i + 1).padStart(2, '0'),
    athleteName: `Player #${DEFAULT_JERSEY_NUMBERS[i] || i + 1}`,
    color,
    startTime: 0,
  }));
}

export const DEFAULT_GOAL_BUTTONS: GoalButtonConfig[] = [
  { id: 1, number: '07', athleteName: 'Forward #7', color: 'rose', startTime: 0 },
  { id: 2, number: '08', athleteName: 'Winger #8', color: 'rose', startTime: 0 },
  { id: 3, number: '09', athleteName: 'Center #9', color: 'rose', startTime: 0 },
  { id: 4, number: '10', athleteName: 'Captain #10', color: 'rose', startTime: 0 },
  { id: 5, number: '11', athleteName: 'Forward #11', color: 'rose', startTime: 0 },
  { id: 6, number: '13', athleteName: 'Winger #13', color: 'rose', startTime: 0 },
  { id: 7, number: '17', athleteName: 'Forward #17', color: 'rose', startTime: 0 },
  { id: 8, number: '19', athleteName: 'Center #19', color: 'rose', startTime: 0 },
  { id: 9, number: '21', athleteName: 'Defense #21', color: 'rose', startTime: 0 },
  { id: 10, number: '23', athleteName: 'Defense #23', color: 'rose', startTime: 0 },
  { id: 11, number: '29', athleteName: 'Sniper #29', color: 'rose', startTime: 0 },
  { id: 12, number: '34', athleteName: 'Forward #34', color: 'rose', startTime: 0 },
  { id: 13, number: '68', athleteName: 'Veteran #68', color: 'rose', startTime: 0 },
  { id: 14, number: '71', athleteName: 'Forward #71', color: 'rose', startTime: 0 },
  { id: 15, number: '77', athleteName: 'Defense #77', color: 'rose', startTime: 0 },
  { id: 16, number: '87', athleteName: 'Captain #87', color: 'rose', startTime: 0 },
  { id: 17, number: '88', athleteName: 'Playmaker #88', color: 'rose', startTime: 0 },
  { id: 18, number: '91', athleteName: 'Forward #91', color: 'rose', startTime: 0 },
  { id: 19, number: '97', athleteName: 'Speedster #97', color: 'rose', startTime: 0 },
  { id: 20, number: '99', athleteName: 'The Great One #99', color: 'rose', startTime: 0 },
];

export const INITIAL_TEAMS: TeamGoalSoundboard[] = [
  {
    id: 'team-home',
    name: 'Home Team',
    color: 'rose',
    buttons: DEFAULT_GOAL_BUTTONS,
  },
  {
    id: 'team-away',
    name: 'Away Team',
    color: 'sky',
    buttons: createBlankTeamButtons('Away Team', 'sky'),
  },
];

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  goalButtons?: GoalButtonConfig[];
  teams?: TeamGoalSoundboard[];
  activeTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
  onSaveTeams?: (teams: TeamGoalSoundboard[]) => void;
  playHornOnPlayerSelect?: boolean;
  onToggleHornOnPlayerSelect?: (val: boolean) => void;
  onSaveGoalButtons?: (buttons: GoalButtonConfig[]) => void;
  onPlayTrack: (track: Track, startTime?: number) => void;
  onStopPlayback: () => void;
  onAddLocalTrack?: (file: File) => Promise<Track | null>;
}

export const COLOR_MAP: Record<string, { bg: string; border: string; text: string; ring: string; badge: string; tabActive: string }> = {
  rose: {
    bg: 'bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-800/80',
    border: 'border-rose-500/40 hover:border-rose-400',
    text: 'text-rose-400',
    ring: 'ring-rose-500',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    tabActive: 'bg-rose-600 text-white border-rose-400 shadow-rose-600/30',
  },
  sky: {
    bg: 'bg-sky-950/40 hover:bg-sky-900/60 active:bg-sky-800/80',
    border: 'border-sky-500/40 hover:border-sky-400',
    text: 'text-sky-400',
    ring: 'ring-sky-500',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    tabActive: 'bg-sky-600 text-white border-sky-400 shadow-sky-600/30',
  },
  amber: {
    bg: 'bg-amber-950/40 hover:bg-amber-900/60 active:bg-amber-800/80',
    border: 'border-amber-500/40 hover:border-amber-400',
    text: 'text-amber-400',
    ring: 'ring-amber-500',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    tabActive: 'bg-amber-600 text-white border-amber-400 shadow-amber-600/30',
  },
  emerald: {
    bg: 'bg-emerald-950/40 hover:bg-emerald-900/60 active:bg-emerald-800/80',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tabActive: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/30',
  },
  purple: {
    bg: 'bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-800/80',
    border: 'border-purple-500/40 hover:border-purple-400',
    text: 'text-purple-400',
    ring: 'ring-purple-500',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    tabActive: 'bg-purple-600 text-white border-purple-400 shadow-purple-600/30',
  },
  indigo: {
    bg: 'bg-indigo-950/40 hover:bg-indigo-900/60 active:bg-indigo-800/80',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    text: 'text-indigo-400',
    ring: 'ring-indigo-500',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    tabActive: 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-600/30',
  },
  orange: {
    bg: 'bg-orange-950/40 hover:bg-orange-900/60 active:bg-orange-800/80',
    border: 'border-orange-500/40 hover:border-orange-400',
    text: 'text-orange-400',
    ring: 'ring-orange-500',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    tabActive: 'bg-orange-600 text-white border-orange-400 shadow-orange-600/30',
  },
};

export default function GoalModal({
  isOpen,
  onClose,
  tracks,
  currentTrackId,
  isPlaying,
  goalButtons: propGoalButtons,
  teams: propTeams,
  activeTeamId: propActiveTeamId,
  onSelectTeam: propOnSelectTeam,
  onSaveTeams: propOnSaveTeams,
  playHornOnPlayerSelect = true,
  onToggleHornOnPlayerSelect,
  onSaveGoalButtons,
  onPlayTrack,
  onStopPlayback,
  onAddLocalTrack,
}: GoalModalProps) {
  // Teams state initialized from props or local storage
  const [teams, setTeams] = useState<TeamGoalSoundboard[]>(() => {
    if (propTeams && propTeams.length > 0) return propTeams;
    try {
      const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Migrate legacy single 20 buttons if present
      const savedLegacy = localStorage.getItem(LEGACY_BUTTONS_KEY);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (Array.isArray(parsed) && parsed.length === 20) {
          const migrated: TeamGoalSoundboard[] = [
            {
              id: 'team-home',
              name: 'Home Team',
              color: 'rose',
              buttons: parsed,
            },
            INITIAL_TEAMS[1], // Away Team default
          ];
          return migrated;
        }
      }
    } catch {}
    return INITIAL_TEAMS;
  });

  // Active Team Tab ID
  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    if (propActiveTeamId) return propActiveTeamId;
    try {
      const saved = localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
      if (saved) return saved;
    } catch {}
    return teams[0]?.id || 'team-home';
  });

  // Keep state in sync with parent props
  useEffect(() => {
    if (propTeams && propTeams.length > 0) {
      setTeams(propTeams);
    }
  }, [propTeams]);

  useEffect(() => {
    if (propActiveTeamId && propActiveTeamId !== activeTeamId) {
      setActiveTeamId(propActiveTeamId);
    }
  }, [propActiveTeamId]);

  // Active team object
  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0] || INITIAL_TEAMS[0];
  const buttons = activeTeam.buttons;

  // New Team Modal / Rename Dialog states
  const [isManagingTeams, setIsManagingTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('sky');
  const [editingTeamNameId, setEditingTeamNameId] = useState<string | null>(null);
  const [tempTeamName, setTempTeamName] = useState('');

  // Edit Mode toggle
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingButton, setEditingButton] = useState<GoalButtonConfig | null>(null);

  // Active firing feedback
  const [activeFiringButton, setActiveFiringButton] = useState<GoalButtonConfig | null>(null);
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hornFileInputRef = useRef<HTMLInputElement>(null);

  // Custom Horn File Info & Controls
  const [customHornName, setCustomHornName] = useState<string | null>(getCustomHornFileName());
  const [isHornSettingsOpen, setIsHornSettingsOpen] = useState(false);
  const [hornStatusMsg, setHornStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    initGoalHornAudio().then((name) => {
      setCustomHornName(name);
    });
  }, []);

  // Upload a custom horn sound file
  const handleUploadCustomHorn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const name = await setCustomGoalHorn(file);
      setCustomHornName(name);
      setHornStatusMsg(`Custom horn loaded: ${file.name}`);
      setTimeout(() => setHornStatusMsg(null), 4000);
    } catch (err) {
      console.error('Failed to set custom horn:', err);
    }
  };

  // Revert custom horn to built-in synth horn
  const handleClearCustomHorn = async () => {
    await clearCustomGoalHorn();
    setCustomHornName(null);
    setHornStatusMsg('Reverted to Built-in Stadium Synth Horn');
    setTimeout(() => setHornStatusMsg(null), 4000);
  };

  // Form states when editing an athlete button
  const [editNumber, setEditNumber] = useState('');
  const [editAthlete, setEditAthlete] = useState('');
  const [editTrackId, setEditTrackId] = useState('');
  const [editStartTime, setEditStartTime] = useState<number>(0);
  const [editColor, setEditColor] = useState('rose');

  // Pair initial tracks to buttons for any team if not already assigned
  useEffect(() => {
    if (tracks.length > 0) {
      let anyChanged = false;
      const updatedTeams = teams.map((team) => {
        let teamChanged = false;
        const updatedButtons = team.buttons.map((btn, idx) => {
          if (!btn.trackId) {
            const track = tracks[idx % tracks.length];
            if (track) {
              teamChanged = true;
              anyChanged = true;
              return {
                ...btn,
                trackId: track.id,
                trackTitle: track.title,
                artist: track.artist,
              };
            }
          }
          return btn;
        });
        return teamChanged ? { ...team, buttons: updatedButtons } : team;
      });

      if (anyChanged) {
        setTeams(updatedTeams);
        persistTeams(updatedTeams, activeTeamId);
      }
    }
  }, [tracks]);

  // Persist teams to storage and notify parents
  const persistTeams = (updatedTeams: TeamGoalSoundboard[], currentActiveId: string) => {
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
      localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, currentActiveId);
      // Also update legacy single key for backwards compatibility
      const current = updatedTeams.find((t) => t.id === currentActiveId) || updatedTeams[0];
      if (current) {
        localStorage.setItem(LEGACY_BUTTONS_KEY, JSON.stringify(current.buttons));
      }
    } catch {}

    if (propOnSaveTeams) {
      propOnSaveTeams(updatedTeams);
    }
    if (onSaveGoalButtons) {
      const current = updatedTeams.find((t) => t.id === currentActiveId) || updatedTeams[0];
      if (current) {
        onSaveGoalButtons(current.buttons);
      }
    }
  };

  // Switch active team tab
  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    try {
      localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, teamId);
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        localStorage.setItem(LEGACY_BUTTONS_KEY, JSON.stringify(team.buttons));
        if (onSaveGoalButtons) onSaveGoalButtons(team.buttons);
      }
    } catch {}
    if (propOnSelectTeam) {
      propOnSelectTeam(teamId);
    }
    setEditingButton(null);
  };

  // Add a new Team / Tab
  const handleAddTeam = () => {
    const trimmed = newTeamName.trim();
    const teamTitle = trimmed || `Team ${teams.length + 1}`;
    const newId = `team-${Date.now()}`;
    const newTeam: TeamGoalSoundboard = {
      id: newId,
      name: teamTitle,
      color: newTeamColor,
      buttons: createBlankTeamButtons(teamTitle),
    };

    // Auto-assign tracks to the new buttons if tracks exist
    if (tracks.length > 0) {
      newTeam.buttons = newTeam.buttons.map((btn, idx) => {
        const track = tracks[idx % tracks.length];
        return {
          ...btn,
          trackId: track?.id,
          trackTitle: track?.title,
          artist: track?.artist,
        };
      });
    }

    const updated = [...teams, newTeam];
    setTeams(updated);
    setActiveTeamId(newId);
    persistTeams(updated, newId);
    setNewTeamName('');
    setIsManagingTeams(false);
  };

  // Delete a team tab
  const handleDeleteTeam = (teamId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (teams.length <= 1) {
      alert('You must keep at least one team roster tab.');
      return;
    }
    const toDelete = teams.find((t) => t.id === teamId);
    if (!confirm(`Delete team roster "${toDelete?.name || 'Team'}"? This removes its 20 player buttons.`)) {
      return;
    }

    const remaining = teams.filter((t) => t.id !== teamId);
    const nextActiveId = activeTeamId === teamId ? remaining[0].id : activeTeamId;
    setTeams(remaining);
    setActiveTeamId(nextActiveId);
    persistTeams(remaining, nextActiveId);
  };

  // Rename a team tab
  const handleStartRenameTeam = (team: TeamGoalSoundboard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTeamNameId(team.id);
    setTempTeamName(team.name);
  };

  const handleSaveRenameTeam = (teamId: string) => {
    const trimmed = tempTeamName.trim();
    if (!trimmed) {
      setEditingTeamNameId(null);
      return;
    }
    const updated = teams.map((t) => (t.id === teamId ? { ...t, name: trimmed } : t));
    setTeams(updated);
    persistTeams(updated, activeTeamId);
    setEditingTeamNameId(null);
  };

  // Persist buttons whenever modified on current team
  const saveCurrentTeamButtons = (newButtons: GoalButtonConfig[]) => {
    const updatedTeams = teams.map((t) =>
      t.id === activeTeamId ? { ...t, buttons: newButtons } : t
    );
    setTeams(updatedTeams);
    persistTeams(updatedTeams, activeTeamId);
  };

  // Trigger button action
  const handleTriggerButton = (btn: GoalButtonConfig) => {
    setActiveFiringButton(btn);
    setCelebrationBanner(`🚨 GOAL! #${btn.number} ${btn.athleteName.toUpperCase()} [${activeTeam.name.toUpperCase()}] 🚨`);

    // Sound stadium arena horn if horn toggle is active
    if (playHornOnPlayerSelect) {
      playGoalHorn();
    }

    // Check assigned track
    const assignedTrack = tracks.find((t) => t.id === btn.trackId) || tracks[0];
    if (assignedTrack) {
      onPlayTrack(assignedTrack, btn.startTime ?? 0);
    }

    // Auto-clear banner flash after 6 seconds
    setTimeout(() => {
      setCelebrationBanner(null);
    }, 6000);
  };

  // Open Edit drawer for specific button
  const handleStartEdit = (btn: GoalButtonConfig, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingButton(btn);
    setEditNumber(btn.number);
    setEditAthlete(btn.athleteName);
    setEditTrackId(btn.trackId || (tracks[0]?.id ?? ''));
    setEditStartTime(btn.startTime ?? 0);
    setEditColor(btn.color || activeTeam.color || 'rose');
  };

  // Save changes to current button
  const handleSaveEdit = () => {
    if (!editingButton) return;

    // Validate 2-digit number
    let cleanNum = editNumber.replace(/\D/g, '').slice(0, 2);
    if (!cleanNum) cleanNum = '00';
    if (cleanNum.length === 1) cleanNum = `0${cleanNum}`;

    const selectedTrack = tracks.find((t) => t.id === editTrackId);

    const updated = buttons.map((b) => {
      if (b.id === editingButton.id) {
        return {
          ...b,
          number: cleanNum,
          athleteName: editAthlete.trim() || `Player #${cleanNum}`,
          trackId: selectedTrack?.id,
          trackTitle: selectedTrack?.title,
          artist: selectedTrack?.artist,
          startTime: Math.max(0, editStartTime),
          color: editColor,
        };
      }
      return b;
    });

    saveCurrentTeamButtons(updated);
    setEditingButton(null);
  };

  // Handle uploading audio file directly for an athlete
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddLocalTrack) return;

    try {
      const newTrack = await onAddLocalTrack(file);
      if (newTrack) {
        setEditTrackId(newTrack.id);
        if (!editAthlete) {
          setEditAthlete(newTrack.title.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      console.warn('File upload failed:', err);
    }
  };

  // Reset current team to 20 presets
  const handleResetDefaults = () => {
    if (window.confirm(`Reset all 20 buttons on "${activeTeam.name}" to factory player presets?`)) {
      const reset = DEFAULT_GOAL_BUTTONS.map((btn, idx) => {
        const track = tracks[idx % tracks.length];
        return {
          ...btn,
          trackId: track?.id,
          trackTitle: track?.title,
          artist: track?.artist,
        };
      });
      saveCurrentTeamButtons(reset);
      setEditingButton(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      {/* Hidden file input for athlete song upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Hidden file input for custom goal horn upload */}
      <input
        ref={hornFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
        className="hidden"
        onChange={handleUploadCustomHorn}
      />

      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl shadow-rose-950/40 overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shadow-sm shadow-rose-600/30">
              <Trophy className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-100 uppercase">
                  Goal Soundboard
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  {teams.length} {teams.length === 1 ? 'TEAM' : 'TEAMS'} &bull; 20 PLAYERS / TAB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Team pages &bull; 2-digit athlete celebration songs &bull; Instant horn blast
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Horn with Player Select Toggle */}
            <button
              id="btn-toggle-horn-on-player"
              type="button"
              onClick={() => onToggleHornOnPlayerSelect && onToggleHornOnPlayerSelect(!playHornOnPlayerSelect)}
              title="Toggle whether the stadium horn sounds when selecting a player"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
                playHornOnPlayerSelect
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${playHornOnPlayerSelect ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>HORN W/ PLAYER:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                playHornOnPlayerSelect ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                {playHornOnPlayerSelect ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Custom Horn Sound Config Button */}
            <button
              id="btn-open-horn-config"
              type="button"
              onClick={() => setIsHornSettingsOpen(!isHornSettingsOpen)}
              title="Configure Horn Audio (Upload Custom Horn or Default Synth)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
                isHornSettingsOpen || customHornName
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>HORN FILE:</span>
              <span className="text-[10px] text-slate-300 truncate max-w-[80px]">
                {customHornName ? 'CUSTOM' : 'SYNTH'}
              </span>
            </button>

            {/* Stadium Horn Manual Blast */}
            <button
              id="btn-test-horn"
              type="button"
              onClick={() => playGoalHorn()}
              title="Blast Active Horn Sound"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">BLAST</span> HORN
            </button>

            {/* Emergency Stop Button */}
            {isPlaying && (
              <button
                id="btn-goal-emergency-stop"
                type="button"
                onClick={onStopPlayback}
                title="Stop Audio Immediately"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP</span>
              </button>
            )}

            {/* Mode Toggle: Trigger vs Program/Edit */}
            <button
              id="btn-toggle-edit-mode"
              type="button"
              onClick={() => {
                setIsEditMode(!isEditMode);
                setEditingButton(null);
              }}
              title={isEditMode ? 'Return to Instant Trigger Mode' : 'Program numbers and songs'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                isEditMode
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'DONE EDITING' : 'PROGRAM'}</span>
            </button>

            {/* Larger Tactile Exit / Back to Game Time Button */}
            <button
              id="btn-close-goal-modal"
              type="button"
              onClick={onClose}
              title="Return to Game Time View"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 active:scale-95 text-slate-200 hover:text-white border-2 border-slate-700 hover:border-rose-500/70 transition-all cursor-pointer shadow-md group shrink-0 ml-1"
            >
              <ArrowLeft className="w-5 h-5 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-black font-mono tracking-wide text-white">BACK</span>
                <span className="text-[9px] font-mono text-slate-400 group-hover:text-rose-300">GAME TIME</span>
              </div>
              <X className="w-4 h-4 text-slate-400 group-hover:text-white ml-0.5" />
            </button>
          </div>
        </div>

        {/* TEAM TABS / ROSTER SELECTOR BAR */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none flex-1 min-w-0">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">TEAMS:</span>
            </span>

            {teams.map((team) => {
              const isSelected = team.id === activeTeamId;
              const teamColorCfg = COLOR_MAP[team.color || 'rose'] || COLOR_MAP.rose;
              const isEditingName = editingTeamNameId === team.id;

              return (
                <div
                  key={team.id}
                  onClick={() => !isEditingName && handleSelectTeam(team.id)}
                  className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                    isSelected
                      ? `${teamColorCfg.tabActive} shadow-md`
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Shield className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />

                  {isEditingName ? (
                    <input
                      autoFocus
                      type="text"
                      value={tempTeamName}
                      onChange={(e) => setTempTeamName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameTeam(team.id);
                        if (e.key === 'Escape') setEditingTeamNameId(null);
                      }}
                      onBlur={() => handleSaveRenameTeam(team.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-950 text-white text-xs font-bold px-1.5 py-0.5 rounded border border-sky-400 w-28 focus:outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => handleStartRenameTeam(team, e)}
                      title="Double-click to rename team tab"
                      className="tracking-wide"
                    >
                      {team.name}
                    </span>
                  )}

                  {/* Team Actions on Tab */}
                  <div className="flex items-center gap-0.5 ml-1">
                    {/* Quick rename button */}
                    <button
                      type="button"
                      onClick={(e) => handleStartRenameTeam(team, e)}
                      title="Rename Team"
                      className={`p-0.5 rounded hover:bg-black/20 ${isSelected ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>

                    {/* Delete button (if more than 1 team) */}
                    {teams.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTeam(team.id, e)}
                        title={`Delete ${team.name}`}
                        className={`p-0.5 rounded hover:bg-rose-500/20 ${isSelected ? 'text-white/80 hover:text-rose-200' : 'text-slate-500 hover:text-rose-400'}`}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Team Button */}
            <button
              id="btn-add-team-tab"
              type="button"
              onClick={() => setIsManagingTeams(!isManagingTeams)}
              title="Add New Team Roster Tab"
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                isManagingTeams
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-rose-400 border-dashed border-rose-500/50 hover:border-rose-400'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD TEAM</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden md:block shrink-0">
            Active: <span className="text-slate-200 font-bold">{activeTeam.name}</span>
          </div>
        </div>

        {/* Add Team Drawer / Form */}
        {isManagingTeams && (
          <div className="bg-slate-950 border-b border-rose-950/60 p-3 sm:p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Layers className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Create New Team Goal Page
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Team Name (e.g. Bruins, Junior A, PeeWee Roster)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
              />

              {/* Color picker for team tab */}
              <select
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-200 capitalize focus:outline-none focus:border-rose-400"
              >
                {Object.keys(COLOR_MAP).map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddTeam}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tab</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManagingTeams(false)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Expandable Horn Sound File Manager Panel */}
        {isHornSettingsOpen && (
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Arena Goal Horn Audio Source
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">Active:</span>
                  <span>{customHornName ? `Custom Audio (${customHornName})` : 'Built-in Multi-Oscillator Stadium Synthesizer'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => hornFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Horn</span>
              </button>

              {customHornName && (
                <button
                  type="button"
                  onClick={handleClearCustomHorn}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revert to Synth</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => playGoalHorn()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Horn</span>
              </button>
            </div>
            {hornStatusMsg && (
              <div className="w-full text-xs text-amber-300 font-mono bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg">
                {hornStatusMsg}
              </div>
            )}
          </div>
        )}

        {/* Celebration Siren Banner (Flashes when goal button is struck) */}
        {celebrationBanner && (
          <div className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 px-4 py-2 text-center text-white font-black text-sm sm:text-base tracking-widest uppercase shadow-inner animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 animate-ping" />
              <span>{celebrationBanner}</span>
            </div>
            <button
              type="button"
              onClick={onStopPlayback}
              className="text-xs bg-slate-950/80 hover:bg-slate-950 text-white px-3 py-1 rounded-lg border border-white/20 font-bold cursor-pointer"
            >
              STOP AUDIO
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Instruction & Current Team Info Note */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {isEditMode
                  ? `Editing ${activeTeam.name}: Tap any button below to customize jersey #, athlete name, song, or cue drop.`
                  : `Showing ${activeTeam.name}: Tap any 2-digit athlete button to instantly fire their goal celebration song & horn.`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset 20 Presets</span>
            </button>
          </div>

          {/* 20 Programmable Buttons Grid for current active team */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {buttons.map((btn) => {
              const colors = COLOR_MAP[btn.color || activeTeam.color || 'rose'] || COLOR_MAP.rose;
              const isCurrentPlaying =
                isPlaying && currentTrackId && btn.trackId === currentTrackId;
              const isSelectedForEdit = editingButton?.id === btn.id;

              return (
                <div
                  key={btn.id}
                  onClick={() => {
                    if (isEditMode) {
                      handleStartEdit(btn);
                    } else {
                      handleTriggerButton(btn);
                    }
                  }}
                  className={`relative group rounded-2xl border p-3 flex flex-col justify-between select-none cursor-pointer transition-all duration-150 min-h-[115px] sm:min-h-[125px] active:scale-95 shadow-md ${
                    colors.bg
                  } ${colors.border} ${
                    isCurrentPlaying
                      ? 'ring-2 ring-rose-500 border-rose-400 shadow-rose-500/20 animate-pulse-slow'
                      : ''
                  } ${isSelectedForEdit ? 'ring-2 ring-sky-400 border-sky-400 bg-slate-800' : ''}`}
                >
                  {/* Top Bar: Button Index & Edit Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                      BTN #{btn.id < 10 ? `0${btn.id}` : btn.id}
                    </span>

                    {/* Quick Edit Icon */}
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(btn, e)}
                      title={`Program Button #${btn.id}`}
                      className="p-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Center: Prominent 2-Digit Jersey Number */}
                  <div className="my-1 flex items-baseline justify-center gap-1">
                    <span className="text-xs font-mono font-bold text-slate-500">#</span>
                    <span
                      className={`text-3xl sm:text-4xl font-black font-mono tracking-tighter ${colors.text} drop-shadow-sm`}
                    >
                      {btn.number}
                    </span>
                  </div>

                  {/* Bottom: Athlete Name & Song Label */}
                  <div className="text-center w-full overflow-hidden">
                    <div className="font-bold text-xs sm:text-[13px] text-slate-200 truncate">
                      {btn.athleteName}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate flex items-center justify-center gap-1 mt-0.5">
                      {isCurrentPlaying ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                          <Volume2 className="w-3 h-3" /> FIRING
                        </span>
                      ) : btn.trackTitle ? (
                        <>
                          <Music className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          <span className="truncate">{btn.trackTitle}</span>
                        </>
                      ) : (
                        <span className="text-slate-500 italic">Default Horn</span>
                      )}
                    </div>

                    {/* Cue start offset tag if configured */}
                    {(btn.startTime ?? 0) > 0 && (
                      <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/70 text-slate-400 border border-slate-800">
                        Drop: {btn.startTime}s
                      </span>
                    )}
                  </div>

                  {/* Active playing indicator badge */}
                  {isCurrentPlaying && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline Programmer / Editor Panel when a button is selected for edit */}
          {editingButton && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-sky-500/40 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Programming Button #{editingButton.id} on {activeTeam.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Set 2-digit jersey number, athlete name, assigned song, and cue start offset
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingButton(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 2-Digit Number Input */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    2-DIGIT NUMBER (00 - 99)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-mono font-bold text-slate-500">
                      #
                    </span>
                    <input
                      type="text"
                      maxLength={2}
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="23"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-lg font-black font-mono text-white focus:outline-none focus:border-sky-400 text-center"
                    />
                  </div>
                </div>

                {/* Athlete Name */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    ATHLETE / PLAYER NAME
                  </label>
                  <input
                    type="text"
                    value={editAthlete}
                    onChange={(e) => setEditAthlete(e.target.value)}
                    placeholder="e.g. Connor McDavid"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Assigned Song Dropdown + Upload Local Audio */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-slate-400 font-semibold">
                      CELEBRATION SONG
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Audio</span>
                    </button>
                  </div>
                  <select
                    value={editTrackId}
                    onChange={(e) => setEditTrackId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} - {t.artist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cue Drop Offset (Seconds) */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    CUE OFFSET (SECONDS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    step={1}
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400 text-center"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 font-semibold">
                  JERSEY ACCENT COLOR
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(COLOR_MAP).map((colorKey) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setEditColor(colorKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono capitalize border transition-all cursor-pointer ${
                        editColor === colorKey
                          ? `${COLOR_MAP[colorKey].badge} ring-2 ${COLOR_MAP[colorKey].ring}`
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {colorKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const previewTrack = tracks.find((t) => t.id === editTrackId);
                    if (previewTrack) {
                      onPlayTrack(previewTrack, editStartTime);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Preview Cue</span>
                </button>

                <button
                  id="btn-save-goal-button"
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Button #{editingButton.id}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            {activeFiringButton
              ? `Last triggered: #${activeFiringButton.number} ${activeFiringButton.athleteName} (${activeTeam.name})`
              : `Active Team: ${activeTeam.name} (${buttons.length} buttons configured)`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
