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
    const aSec = elapsedSec(a, activeKeys);
    const bSec = elapsedSec(b, activeKeys);

    if (aSec === Infinity && bSec === Infinity) {
      // Both haven't started or have no elapsed time — sort alphabetically by army number to avoid NaN
      return (a.armyNumber || '').localeCompare(b.armyNumber || '');
    }
    if (aSec === Infinity) return 1;
    if (bSec === Infinity) return -1;
    return aSec - bSec;
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

  loadRunners: async (activeCheckpointsCount = 4) => {
    try {
      // If there is no active/pending race session in the frontend state,
      // we shouldn't show any runners on the dashboard (they are cleared on refresh)
      const raceSessionId = useRaceStore.getState().raceSessionId;
      if (!raceSessionId) {
        set({ runners: [] });
        return;
      }

      const data = await api.getRunners();
      if (!data) return;
      
      const activeKeys = ALL_CP_KEYS.slice(0, activeCheckpointsCount);

      const mapped = data.map((r) => {
        const timestamps = { start: null, checkpoint1: null, checkpoint2: null, finish: null };
        if (r.checkpoints) {
          r.checkpoints.forEach((cp) => {
            const time = new Date(cp.recorded_at);
            // Format to HH:MM:SS locally
            const timeStr = time.toLocaleTimeString('en-US', { hour12: false });
            timestamps[cp.checkpoint] = timeStr;
          });
        }

        // Map backend lowercase status to frontend UI status
        let status = 'Not Started';
        if (r.status === 'running') {
          status = 'Running';
        } else if (r.status === 'finished') {
          status = 'Finished';
        } else if (timestamps.finish) {
          status = 'Finished';
        } else if (timestamps.start) {
          status = 'Running';
        }

        return {
          rfid: r.rfid_tag,
          armyNumber: r.army_number,
          verified: r.verified,
          status: status,
          timestamps: timestamps,
        };
      });

      set({ runners: sortLeaderboard(mapped, activeKeys) });
    } catch (err) {
      console.error('[runnerStore] Failed to load runners from backend:', err);
    }
  },

  simulateLiveUpdates: (activeCheckpointsCount) => {
    const activeKeys = ALL_CP_KEYS.slice(0, activeCheckpointsCount);

    set((state) => {
      const updated = state.runners.map((runner) => {
        if (runner.status === 'Finished') return runner;

        /**
         * Two-tier probability to simulate real staggered starts:
         *
         *  'Not Started' -> 6% chance per 2s tick to cross the START gate.
         *    Expected wait: ~33s on average, but high variance means some
         *    runners cross start much later (simulating late starters).
         *
         *  'Running'     -> 22% chance per 2s tick to reach the NEXT gate.
         *    Expected time per checkpoint: ~9s once they are running.
         *
         * Status is set purely by which checkpoint was recorded:
         *   start gate logged        -> 'Running'
         *   last active gate logged  -> 'Finished'
         */
        const notStarted = runner.status === 'Not Started';
        const hitThreshold = notStarted ? 0.94 : 0.78;

        if (Math.random() > hitThreshold) {
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
            const raceSessionId = useRaceStore.getState().raceSessionId;
            api.recordCheckpoint(runner.rfid, recordedKey, now.toISOString(), raceSessionId);

            const isFinished = recordedKey === activeKeys[activeKeys.length - 1];
            return {
              ...runner,
              status: isFinished ? 'Finished' : 'Running',
              timestamps: ts,
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
