import { create } from 'zustand';
import { initialRunners } from '../mock/mockData';
import { api } from '../services/api';
import useRaceStore from './raceStore';

// ── Leaderboard sort ───────────────────────────────────────────────────────
// Primary:   most checkpoints crossed (desc)
// Secondary: shortest elapsed time from start to last reached checkpoint (asc)
const ALL_CP_KEYS = ['start', 'checkpoint1', 'checkpoint2', 'finish'];

function toSec(ts) {
  if (!ts) return Infinity;
  const [h, m, s] = ts.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function elapsedSec(runner, activeKeys) {
  if (!runner.timestamps.start) return Infinity;
  // Find the last checkpoint the runner has actually crossed out of the ACTIVE keys
  const lastKey = [...activeKeys].reverse().find(k => runner.timestamps[k]);
  if (!lastKey || lastKey === 'start') return Infinity;
  const diff = toSec(runner.timestamps[lastKey]) - toSec(runner.timestamps.start);
  return diff > 0 ? diff : Infinity;
}

function sortLeaderboard(runners, activeKeys) {
  return [...runners].sort((a, b) => {
    const aCount = activeKeys.filter(k => a.timestamps[k]).length;
    const bCount = activeKeys.filter(k => b.timestamps[k]).length;
    if (bCount !== aCount) return bCount - aCount; // more checkpoints → higher rank
    // Same checkpoint count → shorter elapsed time wins
    return elapsedSec(a, activeKeys) - elapsedSec(b, activeKeys);
  });
}


const useRunnerStore = create((set, get) => ({
  runners: initialRunners,

  addRunners: (newRunners, activeKeys = ALL_CP_KEYS) =>
    set((state) => ({
      runners: sortLeaderboard([...state.runners, ...newRunners], activeKeys),
    })),

  clearRunners: () => set({ runners: [] }),

  // Called by UploadTags after mock verification — marks runners as verified
  markVerified: (armyNumbers) =>
    set((state) => ({
      runners: state.runners.map((r) =>
        armyNumbers.includes(r.armyNumber)
          ? { ...r, verified: true }
          : r
      ),
    })),

  simulateLiveUpdates: (activeCheckpointsCount) => {
    const activeKeys = ALL_CP_KEYS.slice(0, activeCheckpointsCount);

    set((state) => {
      const updated = state.runners.map((runner) => {
        if (runner.status === 'Finished') return runner;
        
        if (Math.random() > 0.8) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
          const ts = { ...runner.timestamps };

          let recordedKey = null;
          for (const key of activeKeys) {
            if (!ts[key]) {
              ts[key] = timeStr;
              recordedKey = key;
              break;
            }
          }

          if (recordedKey) {
            // Push to backend — include raceSessionId so the record links to the active race
            const raceSessionId = useRaceStore.getState().raceSessionId;
            api.recordCheckpoint(runner.rfid, recordedKey, now.toISOString(), raceSessionId);

            // Check if this was the last configured gate
            const isFinished = recordedKey === activeKeys[activeKeys.length - 1];
            return {
              ...runner,
              status: isFinished ? 'Finished' : 'Running',
              timestamps: ts
            };
          }
        }
        return runner;
      });

      return { runners: sortLeaderboard(updated, activeKeys) };
    });
  },
}));

export default useRunnerStore;
