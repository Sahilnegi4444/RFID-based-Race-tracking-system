import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  checkpoints: 2, // 2, 3, or 4
  raceTitle: 'Army RFID Race Tracking',
  mockServerStatus: 'online',
  readers: [
    { id: 'start',  name: 'Start Reader',  status: 'online',  signal: 'strong' },
    { id: 'mid1',   name: 'Mid1 Reader',   status: 'online',  signal: 'good'   },
    { id: 'mid2',   name: 'Mid2 Reader',   status: 'offline', signal: 'none'   },
    { id: 'finish', name: 'Finish Reader', status: 'online',  signal: 'strong' },
  ],

  setCheckpoints: (num) => set({ checkpoints: num }),
  setRaceTitle:   (title) => set({ raceTitle: title }),
  setMockServerStatus: (status) => set({ mockServerStatus: status }),

  updateReaderStatus: (id, status, signal) =>
    set((state) => ({
      readers: state.readers.map(r =>
        r.id === id ? { ...r, status, signal } : r
      ),
    })),
}));

export default useSettingsStore;
