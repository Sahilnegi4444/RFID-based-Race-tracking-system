import { create } from 'zustand';
import { initialRunners } from '../mock/mockData';

const useRunnerStore = create((set, get) => ({
  runners: initialRunners,
  addRunners: (newRunners) => set((state) => ({
    runners: [...state.runners, ...newRunners]
  })),
  simulateLiveUpdates: () => {
    set((state) => {
      const updatedRunners = state.runners.map(runner => {
        if (runner.status === 'Finished') return runner;
        
        // Randomly update timestamps to simulate live progress
        if (Math.random() > 0.8) {
          const now = new Date().toLocaleTimeString('en-US', { hour12: false });
          let newTimestamps = { ...runner.timestamps };
          
          if (!newTimestamps.start) newTimestamps.start = now;
          else if (!newTimestamps.mid1) newTimestamps.mid1 = now;
          else if (!newTimestamps.mid2) newTimestamps.mid2 = now;
          else if (!newTimestamps.finish) {
            newTimestamps.finish = now;
            runner.status = 'Finished';
          }
          
          return { ...runner, timestamps: newTimestamps };
        }
        return runner;
      });
      return { runners: updatedRunners };
    });
  }
}));

export default useRunnerStore;
