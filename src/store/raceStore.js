import { create } from 'zustand';

/**
 * raceStore — controls the race lifecycle state on the frontend.
 * raceStatus: 'idle' | 'active' | 'finished'
 */
const useRaceStore = create((set, get) => ({
  raceStatus: 'idle',       // idle → active → finished
  raceType: 'BPT',          // BPT | PPT | CPT | others
  raceCustomName: '',        // filled when raceType === 'others'
  raceStartedAt: null,       // JS Date object when race started

  setRaceType: (type) => set({ raceType: type }),
  setRaceCustomName: (name) => set({ raceCustomName: name }),

  startRace: () =>
    set({
      raceStatus: 'active',
      raceStartedAt: new Date(),
    }),

  finishRace: () =>
    set({
      raceStatus: 'finished',
    }),

  resetRace: () =>
    set({
      raceStatus: 'idle',
      raceStartedAt: null,
    }),

  /** Human-readable race label */
  raceLabel: () => {
    const { raceType, raceCustomName } = get();
    return raceType === 'others' && raceCustomName ? raceCustomName : raceType;
  },
}));

export default useRaceStore;
