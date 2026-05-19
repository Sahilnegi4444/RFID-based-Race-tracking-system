import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  checkpoints: 2,
  raceTitle: 'Army RFID Race Tracking',
  mockServerStatus: 'online',

  readers: [
    { id: 'start',       name: 'Start Reader',        status: 'online',  signal: 'strong' },
    { id: 'checkpoint1', name: 'Checkpoint 1 Reader',  status: 'online',  signal: 'good'   },
    { id: 'checkpoint2', name: 'Checkpoint 2 Reader',  status: 'offline', signal: 'none'   },
    { id: 'finish',      name: 'Finish Reader',        status: 'online',  signal: 'strong' },
  ],

  setCheckpoints: (num) => set({ checkpoints: num }),
  setRaceTitle: (title) => set({ raceTitle: title }),

  updateReaderStatus: (id, status, signal) =>
    set((state) => ({
      readers: state.readers.map((r) =>
        r.id === id ? { ...r, status, signal } : r
      ),
    })),
}));

export default useSettingsStore;
