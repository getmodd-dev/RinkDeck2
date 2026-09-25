import { Track, TrackMemory, PlayerSettings } from '../types';

const POSITION_MEMORY_KEY = 'pi_touch_audio_track_memory_v1';
const SETTINGS_KEY = 'pi_touch_audio_settings_v1';
const ACTIVE_TRACK_KEY = 'pi_touch_audio_active_track_v1';
const DB_NAME = 'PiTouchAudioDB';
const STORE_NAME = 'local_tracks';

export const DEFAULT_SETTINGS: PlayerSettings = {
  volume: 0.8,
  isMuted: false,
  rememberPosition: false,
  changeTrackOnPause: false, // Default to FALSE: pause should never automatically start another song
  resumeThreshold: 3, // seconds
  crossfade: 2,
  shuffleMode: 'smart',
  repeatMode: 'all',
  screenDimmer: 0,
  outputDevice: 'ipad',
  displayMode: 'fullscreen',
  autoSkipIntro: true,
  lockScreenArtwork: true,
};

// --- Position Memory Helpers ---
export function loadAllTrackMemories(): Record<string, TrackMemory> {
  try {
    const raw = localStorage.getItem(POSITION_MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load track memories', err);
    return {};
  }
}

export function saveTrackMemory(
  trackId: string,
  position: number,
  duration: number,
  completed = false
): void {
  try {
    const memories = loadAllTrackMemories();
    const existing = memories[trackId];
    // Preserve existing startPoint and endPoint
    memories[trackId] = {
      ...(existing || {}),
      position: completed ? (existing?.startPoint ?? 0) : Math.max(0, Math.floor(position)),
      duration: Math.floor(duration),
      lastUpdated: Date.now(),
      completed,
      startPoint: existing?.startPoint,
      endPoint: existing?.endPoint,
    };
    localStorage.setItem(POSITION_MEMORY_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error('Failed to save track memory', err);
  }
}

export function saveTrackCuePoints(
  trackId: string,
  startPoint?: number,
  endPoint?: number,
  duration?: number
): void {
  try {
    const memories = loadAllTrackMemories();
    const existing = memories[trackId] || {
      position: startPoint ?? 0,
      duration: duration || 0,
      lastUpdated: Date.now(),
      completed: false,
    };

    memories[trackId] = {
      ...existing,
      startPoint: startPoint !== undefined ? Math.max(0, Math.floor(startPoint)) : existing.startPoint,
      endPoint: endPoint !== undefined ? Math.max(0, Math.floor(endPoint)) : existing.endPoint,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(POSITION_MEMORY_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error('Failed to save track cue points', err);
  }
}

export function clearTrackCuePoints(trackId: string): void {
  try {
    const memories = loadAllTrackMemories();
    if (memories[trackId]) {
      delete memories[trackId].startPoint;
      delete memories[trackId].endPoint;
      localStorage.setItem(POSITION_MEMORY_KEY, JSON.stringify(memories));
    }
  } catch (err) {
    console.error('Failed to clear track cue points', err);
  }
}

export function getTrackMemory(trackId: string): TrackMemory | null {
  const memories = loadAllTrackMemories();
  return memories[trackId] || null;
}

export function clearTrackMemory(trackId: string): void {
  try {
    const memories = loadAllTrackMemories();
    delete memories[trackId];
    localStorage.setItem(POSITION_MEMORY_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error('Failed to clear track memory', err);
  }
}

export function clearAllTrackMemories(): void {
  try {
    localStorage.removeItem(POSITION_MEMORY_KEY);
  } catch (err) {
    console.error('Failed to clear all track memories', err);
  }
}

// --- Player Settings Helpers ---
export function loadPlayerSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function savePlayerSettings(settings: Partial<PlayerSettings>): void {
  try {
    const current = loadPlayerSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save player settings', err);
  }
}

export function saveActiveTrackId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_TRACK_KEY, id);
  } catch {}
}

export function getSavedActiveTrackId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TRACK_KEY);
  } catch {
    return null;
  }
}

// --- IndexedDB for Uploaded Local Audio Files ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalTrackToDB(track: Track, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // We store metadata and the audio blob
    const item = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      format: track.format,
      genre: track.genre,
      fileSize: track.fileSize,
      coverColor: track.coverColor,
      addedAt: track.addedAt,
      audioBlob: blob,
    };
    store.put(item);
  } catch (err) {
    console.error('Error saving local audio to IndexedDB', err);
  }
}

export async function saveCustomGoalHornBlob(blob: Blob, fileName: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: '__custom_goal_horn__',
      fileName,
      audioBlob: blob,
      savedAt: Date.now(),
    });
  } catch (err) {
    console.error('Error saving custom goal horn to DB:', err);
  }
}

export async function loadCustomGoalHornBlob(): Promise<{ blob: Blob; fileName: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('__custom_goal_horn__');
      req.onsuccess = () => {
        if (req.result && req.result.audioBlob) {
          resolve({
            blob: req.result.audioBlob,
            fileName: req.result.fileName || 'custom-horn.mp3',
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteCustomGoalHornBlob(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('__custom_goal_horn__');
  } catch (err) {
    console.error('Error deleting custom goal horn from DB:', err);
  }
}

export async function loadSavedLocalTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []).filter((rec: any) => rec.id !== '__custom_goal_horn__');
        const tracks: Track[] = records.map((rec: any) => {
          const url = URL.createObjectURL(rec.audioBlob);
          return {
            id: rec.id,
            title: rec.title,
            artist: rec.artist,
            album: rec.album,
            duration: rec.duration,
            format: rec.format || 'Local Audio',
            genre: rec.genre || 'Local Media',
            fileSize: rec.fileSize,
            coverColor: rec.coverColor || '#38bdf8',
            url,
            blob: rec.audioBlob,
            isLocalFile: true,
            addedAt: rec.addedAt || Date.now(),
          };
        });
        resolve(tracks);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteSavedLocalTrack(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(trackId);
  } catch (err) {
    console.error('Failed to delete track from DB', err);
  }
}

// --- Server-synced memories for Unraid Docker & iPad ---
export async function fetchServerMemories(): Promise<Record<string, TrackMemory>> {
  try {
    const res = await fetch('/api/memories');
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function syncMemoriesToServer(memories: Record<string, TrackMemory>): Promise<void> {
  try {
    await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memories),
    });
  } catch (err) {
    console.error('Failed to sync memories to server:', err);
  }
}

