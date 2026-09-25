import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Track,
  GoalButtonConfig,
  TeamGoalSoundboard,
  PlayerSettings,
  ShuffleMode,
  ActiveGoalCelebration,
} from './types';
import {
  GlobalAudioEngine,
  GlobalGoalAudioEngine,
  generateSmartShuffleQueue,
} from './utils/audioController';
import { playGoalHorn, stopGoalHorn } from './utils/goalHorn';
import {
  INITIAL_DEMO_TRACKS,
  generateDemoTrackBlob,
} from './utils/audioSynth';
import {
  loadSavedLocalTracks,
  saveLocalTrackToDB,
  deleteSavedLocalTrack,
  loadPlayerSettings,
  savePlayerSettings,
} from './utils/storage';
import {
  INITIAL_TEAMS,
  TEAMS_STORAGE_KEY,
  ACTIVE_TEAM_STORAGE_KEY,
  LEGACY_BUTTONS_KEY,
  createBlankTeamButtons,
} from './components/GoalModal';

import RinkDeckHeader from './components/RinkDeckHeader';
import ArenaGoalDeck from './components/ArenaGoalDeck';
import ArenaTransportBar from './components/ArenaTransportBar';
import ArenaPlaylist from './components/ArenaPlaylist';
import ProgramRosterModal from './components/ProgramRosterModal';
import PlexIntegrationModal from './components/PlexIntegrationModal';
import { CheckCircle } from 'lucide-react';

export default function App() {
  // --- Audio Library State ---
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string>('');
  const [queueOrder, setQueueOrder] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings: volume, mute, shuffle
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    const loaded = loadPlayerSettings();
    return { ...loaded, changeTrackOnPause: false };
  });

  // Excluded Track IDs (only played for goals or on direct tap)
  const [excludedTrackIds, setExcludedTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ipad_excluded_track_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Goal Horn on Player Select Toggle
  const [playHornOnPlayerSelect, setPlayHornOnPlayerSelect] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ipad_horn_on_player_select');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });

  // --- Multi-Team Rosters ---
  const [goalTeams, setGoalTeams] = useState<TeamGoalSoundboard[]>(() => {
    try {
      const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const savedLegacy = localStorage.getItem(LEGACY_BUTTONS_KEY);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (Array.isArray(parsed) && parsed.length === 20) {
          return [
            { id: 'team-home', name: 'Home Team', color: 'rose', buttons: parsed },
            INITIAL_TEAMS[1],
          ];
        }
      }
    } catch {}
    return INITIAL_TEAMS;
  });

  const [activeGoalTeamId, setActiveGoalTeamId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
      if (savedId) return savedId;
    } catch {}
    return 'team-home';
  });

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isPlexModalOpen, setIsPlexModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Goal Celebration (Decoupled from Arena Transport Bar)
  const [activeCelebration, setActiveCelebration] = useState<ActiveGoalCelebration | null>(null);

  const demoBlobsRef = useRef<Map<string, string>>(new Map());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active Team & Buttons
  const activeGoalTeam = useMemo(
    () => goalTeams.find((t) => t.id === activeGoalTeamId) || goalTeams[0] || INITIAL_TEAMS[0],
    [goalTeams, activeGoalTeamId]
  );
  const goalButtons = activeGoalTeam.buttons;

  // Active Track Object
  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) || tracks[0],
    [tracks, currentTrackId]
  );

  // --- Initial Library Loading with /app/data Storage Sync ---
  useEffect(() => {
    let isMounted = true;

    async function initLibrary() {
      // 1. Fetch tracks stored in /app/data/tracks from server
      let serverTracks: Track[] = [];
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            serverTracks = data;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch /api/tracks:', err);
      }

      // 2. Load IndexedDB local tracks
      const savedUserTracks = await loadSavedLocalTracks();

      // 3. Load saved Plex imported tracks
      let savedPlexTracks: Track[] = [];
      try {
        const plexJson = localStorage.getItem('rinkdeck_plex_tracks');
        if (plexJson) {
          savedPlexTracks = JSON.parse(plexJson);
        }
      } catch {}

      // 4. Built-in demo tracks as fallback (respect user removal)
      let hideDemoTracks = false;
      let removedDemoIds: string[] = [];
      try {
        hideDemoTracks = localStorage.getItem('rinkdeck_hide_demo_tracks') === 'true';
        const savedRemoved = localStorage.getItem('rinkdeck_removed_demo_ids');
        if (savedRemoved) removedDemoIds = JSON.parse(savedRemoved);
      } catch {}

      const initialTracks: Track[] = hideDemoTracks
        ? []
        : INITIAL_DEMO_TRACKS.filter((demo) => !removedDemoIds.includes(demo.id)).map((demo) => ({
            ...demo,
            url: '',
          }));

      // Combine without duplicate IDs
      const seenIds = new Set<string>();
      const allTracks: Track[] = [];
      [...serverTracks, ...savedUserTracks, ...savedPlexTracks, ...initialTracks].forEach((t) => {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          allTracks.push(t);
        }
      });

      if (!isMounted) return;
      setTracks(allTracks);

      const startingId = allTracks[0]?.id || '';
      setCurrentTrackId(startingId);

      if (settings.shuffleMode !== 'off') {
        setQueueOrder(generateSmartShuffleQueue(allTracks, startingId));
      } else {
        setQueueOrder(allTracks.map((t) => t.id));
      }

      // 4. Fetch Rosters stored in /app/data/rosters.json
      try {
        const rRes = await fetch('/api/rosters');
        if (rRes.ok) {
          const rData = await rRes.json();
          if (Array.isArray(rData) && rData.length > 0) {
            setGoalTeams(rData);
            try {
              localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(rData));
            } catch {}
          }
        }
      } catch {}

      // 5. Fetch Settings from /app/data/settings.json
      try {
        const sRes = await fetch('/api/settings');
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.excludedTrackIds && Array.isArray(sData.excludedTrackIds)) {
            setExcludedTrackIds(sData.excludedTrackIds);
          }
        }
      } catch {}
    }

    initLibrary();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Volume & Mute with Both Main Audio Engine and Goal Celebration Audio Engine
  useEffect(() => {
    savePlayerSettings(settings);
    const effectiveVol = settings.isMuted ? 0 : settings.volume;
    GlobalAudioEngine.setVolume(effectiveVol);
    GlobalAudioEngine.setMuted(settings.isMuted);
    GlobalGoalAudioEngine.setVolume(effectiveVol);
    GlobalGoalAudioEngine.setMuted(settings.isMuted);
  }, [settings]);

  // Listen for Goal Celebration audio finish
  useEffect(() => {
    const goalAudio = GlobalGoalAudioEngine.getAudioElement();
    const handleGoalEnded = () => {
      setActiveCelebration(null);
    };
    goalAudio.addEventListener('ended', handleGoalEnded);
    goalAudio.addEventListener('error', handleGoalEnded);
    return () => {
      goalAudio.removeEventListener('ended', handleGoalEnded);
      goalAudio.removeEventListener('error', handleGoalEnded);
    };
  }, []);

  // Ensure track has valid audio URL
  const prepareTrackUrl = useCallback(async (track: Track): Promise<string> => {
    if (track.url) return track.url;
    if (demoBlobsRef.current.has(track.id)) {
      return demoBlobsRef.current.get(track.id)!;
    }

    let style: 'lofi' | 'synthwave' | 'ambient' | 'piano' | 'electro' = 'lofi';
    if (track.id.includes('synthwave')) style = 'synthwave';
    else if (track.id.includes('ambient')) style = 'ambient';
    else if (track.id.includes('piano')) style = 'piano';
    else if (track.id.includes('electro')) style = 'electro';

    const blob = await generateDemoTrackBlob(style, track.duration);
    const objectUrl = URL.createObjectURL(blob);
    demoBlobsRef.current.set(track.id, objectUrl);

    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, url: objectUrl, blob } : t))
    );

    return objectUrl;
  }, []);

  // Load and play track
  const loadAndPlayTrack = useCallback(
    async (track: Track, autoPlay = true, overridePosition?: number) => {
      GlobalAudioEngine.initAudioContext();
      GlobalAudioEngine.resumeContext();

      const audio = GlobalAudioEngine.getAudioElement();
      const url = await prepareTrackUrl(track);

      if (audio.src !== url) {
        audio.src = url;
      }

      setCurrentTrackId(track.id);

      const startSec = overridePosition !== undefined ? overridePosition : (track.presetStart ?? 0);

      const onCanPlay = () => {
        if (startSec > 0 && startSec < (audio.duration || track.duration)) {
          audio.currentTime = startSec;
          setCurrentTime(startSec);
        } else {
          audio.currentTime = 0;
          setCurrentTime(0);
        }

        if (autoPlay) {
          audio.play().then(() => setIsPlaying(true)).catch(console.warn);
        }
        audio.removeEventListener('canplay', onCanPlay);
      };

      audio.addEventListener('canplay', onCanPlay);
      audio.load();
    },
    [prepareTrackUrl]
  );

  // Audio Event Listeners
  useEffect(() => {
    const audio = GlobalAudioEngine.getAudioElement();

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      handleNextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queueOrder, currentTrackId, tracks, excludedTrackIds]);

  // Next Track in Rotation (skips excluded goal tracks)
  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;

    const availableTracks = tracks.filter((t) => !excludedTrackIds.includes(t.id));
    const pool = availableTracks.length > 0 ? availableTracks : tracks;

    const currentIndex = pool.findIndex((t) => t.id === currentTrackId);
    const nextIndex = (currentIndex + 1) % pool.length;
    const nextTrack = pool[nextIndex];

    if (nextTrack) {
      loadAndPlayTrack(nextTrack, true);
    }
  }, [tracks, excludedTrackIds, currentTrackId, loadAndPlayTrack]);

  // Previous Track
  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;

    const audio = GlobalAudioEngine.getAudioElement();
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const availableTracks = tracks.filter((t) => !excludedTrackIds.includes(t.id));
    const pool = availableTracks.length > 0 ? availableTracks : tracks;

    const currentIndex = pool.findIndex((t) => t.id === currentTrackId);
    const prevIndex = (currentIndex - 1 + pool.length) % pool.length;
    const prevTrack = pool[prevIndex];

    if (prevTrack) {
      loadAndPlayTrack(prevTrack, true);
    }
  }, [tracks, excludedTrackIds, currentTrackId, loadAndPlayTrack]);

  // Stop Goal Celebration Audio
  const handleStopCelebration = useCallback(() => {
    GlobalGoalAudioEngine.stop();
    stopGoalHorn();
    setActiveCelebration(null);
    showToast('Goal celebration stopped');
  }, []);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    const audio = GlobalAudioEngine.getAudioElement();
    GlobalAudioEngine.initAudioContext();
    GlobalAudioEngine.resumeContext();

    // If goal celebration is currently playing, cut it when faceoff music begins
    if (activeCelebration) {
      GlobalGoalAudioEngine.stop();
      stopGoalHorn();
      setActiveCelebration(null);
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack) {
        if (!audio.src || audio.src === window.location.href) {
          loadAndPlayTrack(currentTrack, true);
        } else {
          audio.play().then(() => setIsPlaying(true)).catch(() => {
            loadAndPlayTrack(currentTrack, true);
          });
        }
      }
    }
  }, [activeCelebration, isPlaying, currentTrack, loadAndPlayTrack]);

  // Stop Playback
  const handleStop = useCallback(() => {
    const audio = GlobalAudioEngine.getAudioElement();
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    GlobalGoalAudioEngine.stop();
    stopGoalHorn();
    setActiveCelebration(null);
  }, []);

  // Seek
  const handleSeek = useCallback((seconds: number) => {
    const audio = GlobalAudioEngine.getAudioElement();
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  // Panic Mute
  const handlePanicMute = useCallback(() => {
    setSettings((s) => {
      const next = !s.isMuted;
      GlobalAudioEngine.setMuted(next);
      GlobalAudioEngine.setVolume(next ? 0 : s.volume);
      GlobalGoalAudioEngine.setMuted(next);
      GlobalGoalAudioEngine.setVolume(next ? 0 : s.volume);
      if (next) {
        stopGoalHorn();
      }
      return { ...s, isMuted: next };
    });
  }, []);

  // Volume Change
  const handleVolumeChange = useCallback((vol: number) => {
    setSettings((s) => {
      GlobalAudioEngine.setVolume(vol);
      GlobalAudioEngine.setMuted(false);
      GlobalGoalAudioEngine.setVolume(vol);
      GlobalGoalAudioEngine.setMuted(false);
      return { ...s, volume: vol, isMuted: false };
    });
  }, []);

  // Cycle Shuffle Mode
  const handleCycleShuffle = useCallback(() => {
    setSettings((s) => {
      const modes: ShuffleMode[] = ['smart', 'random', 'off'];
      const next = modes[(modes.indexOf(s.shuffleMode) + 1) % modes.length];
      if (next !== 'off') {
        setQueueOrder(generateSmartShuffleQueue(tracks, currentTrackId));
        showToast(`Shuffle: ${next.toUpperCase()}`);
      } else {
        setQueueOrder(tracks.map((t) => t.id));
        showToast('Shuffle: OFF (Sequential)');
      }
      return { ...s, shuffleMode: next };
    });
  }, [tracks, currentTrackId]);

  // Tap an individual athlete celebration button (Decoupled from Arena Transport Bar!)
  const handleSelectAthlete = useCallback(async (btn: GoalButtonConfig) => {
    // If user taps the active celebrating athlete button, cut it immediately!
    if (activeCelebration && activeCelebration.buttonId === btn.id) {
      handleStopCelebration();
      return;
    }

    // 1. Cut any previous celebration audio/horn
    GlobalGoalAudioEngine.stop();
    stopGoalHorn();

    // 2. Sound stadium arena horn if enabled
    if (playHornOnPlayerSelect) {
      playGoalHorn();
    }

    // 3. Pause main transport audio if playing
    const mainAudio = GlobalAudioEngine.getAudioElement();
    if (isPlaying) {
      mainAudio.pause();
      setIsPlaying(false);
    }

    // 4. Cue FRESH playlist track on the Arena Transport Bar!
    // The operator will have a fresh track ready at 0:00 for the upcoming faceoff
    if (tracks.length > 0) {
      const availableTracks = tracks.filter((t) => !excludedTrackIds.includes(t.id));
      const pool = availableTracks.length > 0 ? availableTracks : tracks;
      if (pool.length > 0) {
        const currentIndex = pool.findIndex((t) => t.id === currentTrackId);
        const nextIndex = (currentIndex + 1) % pool.length;
        const freshTrack = pool[nextIndex];
        if (freshTrack) {
          setCurrentTrackId(freshTrack.id);
          prepareTrackUrl(freshTrack).then((url) => {
            if (mainAudio.src !== url) {
              mainAudio.src = url;
            }
            const startSec = freshTrack.presetStart ?? 0;
            mainAudio.currentTime = startSec;
            setCurrentTime(startSec);
          });
        }
      }
    }

    // 5. Play athlete celebration song on dedicated Goal Audio Engine
    const targetTrack = tracks.find((t) =>
      (btn.trackId && (t.id === btn.trackId || (t as any).filename === btn.trackId)) ||
      (btn.trackTitle && t.title.toLowerCase() === btn.trackTitle.toLowerCase())
    );

    if (targetTrack) {
      try {
        const songUrl = await prepareTrackUrl(targetTrack);
        await GlobalGoalAudioEngine.play(
          songUrl,
          btn.startTime || 0,
          settings.isMuted ? 0 : settings.volume
        );
        setActiveCelebration({
          buttonId: btn.id,
          number: btn.number,
          athleteName: btn.athleteName,
          trackTitle: targetTrack.title,
          artist: targetTrack.artist,
          startTime: btn.startTime,
        });
        showToast(`🚨 GOAL! #${btn.number} ${btn.athleteName} — Fresh track on deck`);
      } catch (err) {
        console.warn('Failed to play celebration track:', err);
        setActiveCelebration({
          buttonId: btn.id,
          number: btn.number,
          athleteName: btn.athleteName,
          trackTitle: targetTrack.title,
        });
      }
    } else {
      setActiveCelebration({
        buttonId: btn.id,
        number: btn.number,
        athleteName: btn.athleteName,
        trackTitle: 'Stadium Horn Blast',
      });
      showToast(`🚨 GOAL! #${btn.number} ${btn.athleteName} — Fresh track on deck`);
    }
  }, [
    activeCelebration,
    handleStopCelebration,
    playHornOnPlayerSelect,
    isPlaying,
    tracks,
    excludedTrackIds,
    currentTrackId,
    prepareTrackUrl,
    settings.isMuted,
    settings.volume,
  ]);

  // Toggle Track Excluded from Rotation
  const handleToggleTrackExcluded = useCallback((trackId: string) => {
    setExcludedTrackIds((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      try {
        localStorage.setItem('ipad_excluded_track_ids', JSON.stringify(next));
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ excludedTrackIds: next }),
        }).catch(() => {});
      } catch {}
      return next;
    });
  }, []);

  // Add Audio Files: Uploads to /app/data/tracks/ on server and adds to local library
  const handleAddFiles = useCallback(async (files: FileList) => {
    const formData = new FormData();
    let hasUploads = false;
    const localNewTracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|flac|ogg|m4a|aac)$/i)) {
        continue;
      }
      formData.append('files', file);
      hasUploads = true;

      const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const title = file.name.replace(/\.[^/.]+$/, '');
      const blobUrl = URL.createObjectURL(file);

      const track: Track = {
        id,
        title,
        artist: 'Arena Import',
        album: 'RinkDeck Library',
        duration: 180,
        url: blobUrl,
        blob: file,
        isLocalFile: true,
        addedAt: Date.now(),
        format: file.name.split('.').pop()?.toUpperCase() || 'AUDIO',
        source: 'local',
      };

      await saveLocalTrackToDB(track, file);
      localNewTracks.push(track);
    }

    // Upload to server /app/data/tracks/
    if (hasUploads) {
      try {
        const res = await fetch('/api/tracks/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const result = await res.json();
          if (result.tracks && Array.isArray(result.tracks)) {
            setTracks((prev) => {
              const combined = [...result.tracks, ...prev];
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              return unique;
            });
            showToast(`Saved ${result.tracks.length} track(s) to /app/data/tracks`);
            return;
          }
        }
      } catch (err) {
        console.warn('Server upload fallback to local state', err);
      }
    }

    if (localNewTracks.length > 0) {
      setTracks((prev) => [...localNewTracks, ...prev]);
      showToast(`Added ${localNewTracks.length} song(s) to library`);
    }
  }, []);

  // Remove Track: Deletes from /app/data/tracks/, local DB, or remembers removed demo tracks
  const handleRemoveTrack = useCallback(async (trackId: string) => {
    try {
      await fetch(`/api/tracks/${encodeURIComponent(trackId)}`, { method: 'DELETE' });
    } catch {}
    await deleteSavedLocalTrack(trackId);

    // If it's a default/demo track, remember removal so it doesn't respawn on reload
    if (trackId.startsWith('demo-') || INITIAL_DEMO_TRACKS.some((d) => d.id === trackId)) {
      try {
        const saved = localStorage.getItem('rinkdeck_removed_demo_ids');
        const list = saved ? JSON.parse(saved) : [];
        if (!list.includes(trackId)) {
          const next = [...list, trackId];
          localStorage.setItem('rinkdeck_removed_demo_ids', JSON.stringify(next));
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ removedDemoTrackIds: next }),
          }).catch(() => {});
        }
      } catch {}
    }

    setTracks((prev) => {
      const remaining = prev.filter((t) => t.id !== trackId && (t as any).filename !== trackId);
      if (currentTrackId === trackId && remaining.length > 0) {
        setCurrentTrackId(remaining[0].id);
      }
      return remaining;
    });
    setExcludedTrackIds((prev) => prev.filter((id) => id !== trackId));
    showToast('Track removed');
  }, [currentTrackId]);

  // Remove all default demo synthesizer audio tracks in 1-click
  const handleClearDefaultTracks = useCallback(() => {
    const demoIds = INITIAL_DEMO_TRACKS.map((t) => t.id);
    try {
      localStorage.setItem('rinkdeck_hide_demo_tracks', 'true');
      localStorage.setItem('rinkdeck_removed_demo_ids', JSON.stringify(demoIds));
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideDemoTracks: true, removedDemoTrackIds: demoIds }),
      }).catch(() => {});
    } catch {}

    setTracks((prev) => {
      const remaining = prev.filter(
        (t) => !demoIds.includes(t.id) && !t.id.startsWith('demo-') && t.source !== 'demo'
      );
      if (demoIds.includes(currentTrackId) && remaining.length > 0) {
        setCurrentTrackId(remaining[0].id);
      }
      return remaining;
    });
    showToast('Removed all default demo audio files');
  }, [currentTrackId]);

  // Import tracks selected from Plex Media Server
  const handleImportPlexTracks = useCallback((importedTracks: Track[]) => {
    let existingPlex: Track[] = [];
    try {
      const saved = localStorage.getItem('rinkdeck_plex_tracks');
      if (saved) existingPlex = JSON.parse(saved);
    } catch {}

    const mergedPlex = [
      ...importedTracks,
      ...existingPlex.filter((ep) => !importedTracks.some((it) => it.id === ep.id)),
    ];

    try {
      localStorage.setItem('rinkdeck_plex_tracks', JSON.stringify(mergedPlex));
    } catch {}

    setTracks((prev) => {
      const seen = new Set(prev.map((t) => t.id));
      const newItems = importedTracks.filter((t) => !seen.has(t.id));
      return [...newItems, ...prev];
    });

    showToast(`Imported ${importedTracks.length} track(s) from Plex`);
  }, []);

  // Team Selection & Persistence
  const handleSelectTeam = useCallback((teamId: string) => {
    setActiveGoalTeamId(teamId);
    try {
      localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, teamId);
    } catch {}
    const team = goalTeams.find((t) => t.id === teamId);
    if (team) {
      showToast(`Active Roster: "${team.name}"`);
    }
  }, [goalTeams]);

  const handleAddTeam = useCallback(() => {
    const newId = `team-${Date.now()}`;
    const newTeamNumber = goalTeams.length + 1;
    const newTeam: TeamGoalSoundboard = {
      id: newId,
      name: `Team ${newTeamNumber}`,
      color: 'sky',
      buttons: createBlankTeamButtons(`Team ${newTeamNumber}`, 'sky'),
    };

    const updated = [...goalTeams, newTeam];
    setGoalTeams(updated);
    setActiveGoalTeamId(newId);
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, newId);
      fetch('/api/rosters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    } catch {}
    showToast(`Created new roster: "${newTeam.name}"`);
  }, [goalTeams]);

  // Delete Team Roster (Allows removing added teams)
  const handleDeleteTeam = useCallback((teamId: string) => {
    if (goalTeams.length <= 1) {
      showToast('Cannot delete the only remaining team roster.');
      return;
    }

    const teamToDelete = goalTeams.find((t) => t.id === teamId);
    const remaining = goalTeams.filter((t) => t.id !== teamId);
    setGoalTeams(remaining);

    let nextActiveId = activeGoalTeamId;
    if (activeGoalTeamId === teamId) {
      nextActiveId = remaining[0]?.id || 'team-home';
      setActiveGoalTeamId(nextActiveId);
    }

    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(remaining));
      localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, nextActiveId);
      fetch('/api/rosters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remaining),
      }).catch(console.warn);
    } catch {}

    showToast(`Deleted team: "${teamToDelete?.name || 'Team'}"`);
  }, [goalTeams, activeGoalTeamId]);

  // Persists roster teams to localStorage and /app/data/rosters.json
  const handleSaveTeams = useCallback((updatedTeams: TeamGoalSoundboard[]) => {
    setGoalTeams(updatedTeams);
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
      fetch('/api/rosters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeams),
      }).catch(console.warn);
    } catch {}
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-sky-500/50 text-sky-300 font-mono text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Streamlined Arena Header */}
      <RinkDeckHeader
        teams={goalTeams}
        activeTeamId={activeGoalTeamId}
        onSelectTeam={handleSelectTeam}
        onAddTeam={handleAddTeam}
        onDeleteTeam={handleDeleteTeam}
        volume={settings.volume}
        isMuted={settings.isMuted}
        onVolumeChange={handleVolumeChange}
        onPanicMute={handlePanicMute}
        playHornOnPlayerSelect={playHornOnPlayerSelect}
        onToggleHornOnPlayerSelect={(enabled) => {
          setPlayHornOnPlayerSelect(enabled);
          try {
            localStorage.setItem('ipad_horn_on_player_select', String(enabled));
          } catch {}
          showToast(enabled ? 'Horn on Player: ENABLED' : 'Horn on Player: OFF');
        }}
        onOpenProgramRoster={() => setIsRosterModalOpen(true)}
        onOpenPlexModal={() => setIsPlexModalOpen(true)}
        activeFormat={currentTrack?.format}
      />

      {/* Main Arena Work Area (2-Column Grid) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-0 overflow-hidden">
        {/* Left Column: 20 Athlete Goal Soundboard Buttons */}
        <div className="lg:col-span-7 h-full min-h-0">
          <ArenaGoalDeck
            goalButtons={goalButtons}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            activeCelebration={activeCelebration}
            onSelectAthlete={handleSelectAthlete}
            onStopCelebration={handleStopCelebration}
          />
        </div>

        {/* Right Column: Transport Bar + Arena Music Library */}
        <div className="lg:col-span-5 h-full min-h-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Transport Bar positioned directly above the playlist */}
          <ArenaTransportBar
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            shuffleMode={settings.shuffleMode}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
            onSeek={handleSeek}
            onCycleShuffle={handleCycleShuffle}
          />

          {/* Arena Music Library & Rotation */}
          <div className="flex-1 min-h-0">
            <ArenaPlaylist
              tracks={tracks}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              excludedTrackIds={excludedTrackIds}
              goalButtons={goalButtons}
              onSelectTrack={(track) => loadAndPlayTrack(track, true)}
              onToggleTrackExcluded={handleToggleTrackExcluded}
              onAddFiles={handleAddFiles}
              onRemoveTrack={handleRemoveTrack}
              onClearDefaultTracks={handleClearDefaultTracks}
              onOpenPlexModal={() => setIsPlexModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Program Roster Modal */}
      <ProgramRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        teams={goalTeams}
        activeTeamId={activeGoalTeamId}
        tracks={tracks}
        onSaveTeams={handleSaveTeams}
        onSelectTeam={handleSelectTeam}
        onDeleteTeam={handleDeleteTeam}
        onAddTeam={handleAddTeam}
      />

      {/* Plex Media Server Integration Modal */}
      <PlexIntegrationModal
        isOpen={isPlexModalOpen}
        onClose={() => setIsPlexModalOpen(false)}
        onImportTracks={handleImportPlexTracks}
        onPlayTrack={(track) => loadAndPlayTrack(track, true)}
      />
    </div>
  );
}
