import { create } from 'zustand';
import { initialRunners } from '../mock/mockData';

// ── Leaderboard sort ───────────────────────────────────────────────────────
// Primary:   most checkpoints crossed (desc)
// Secondary: shortest elapsed time from start to last reached checkpoint (asc)
const CP_KEYS = ['start', 'checkpoint1', 'checkpoint2', 'finish'];

function toSec(ts) {
  if (!ts) return Infinity;
  const [h, m, s] = ts.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function elapsedSec(runner) {
  if (!runner.timestamps.start) return Infinity;
  // Find the last checkpoint the runner has actually crossed
  const lastKey = [...CP_KEYS].reverse().find(k => runner.timestamps[k]);
  if (!lastKey || lastKey === 'start') return Infinity;
  const diff = toSec(runner.timestamps[lastKey]) - toSec(runner.timestamps.start);
  return diff > 0 ? diff : Infinity;
}

function sortLeaderboard(runners) {
  return [...runners].sort((a, b) => {
    const aCount = CP_KEYS.filter(k => a.timestamps[k]).length;
    const bCount = CP_KEYS.filter(k => b.timestamps[k]).length;
    if (bCount !== aCount) return bCount - aCount; // more checkpoints → higher rank
    // Same checkpoint count → shorter elapsed time wins
    return elapsedSec(a) - elapsedSec(b);
  });
}


const useRunnerStore = create((set, get) => ({
  runners: initialRunners,

  addRunners: (newRunners) =>
    set((state) => ({
      runners: sortLeaderboard([...state.runners, ...newRunners]),
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

  simulateLiveUpdates: () => {
    set((state) => {
      const updated = state.runners.map((runner) => {
        if (runner.status === 'Finished') return runner;
        if (Math.random() > 0.8) {
          const now = new Date().toLocaleTimeString('en-US', { hour12: false });
          const ts = { ...runner.timestamps };

          if (!ts.start)            { ts.start = now; }
          else if (!ts.checkpoint1) { ts.checkpoint1 = now; }
          else if (!ts.checkpoint2) { ts.checkpoint2 = now; }
          else if (!ts.finish)      { return { ...runner, status: 'Finished', timestamps: { ...ts, finish: now } }; }

          return { ...runner, timestamps: ts };
        }
        return runner;
      });

      return { runners: sortLeaderboard(updated) };
    });
  },
}));

export default useRunnerStore;
