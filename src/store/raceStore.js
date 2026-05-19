import { create } from 'zustand';
import { api } from '../services/api';

/**
 * raceStore — controls the race lifecycle state on the frontend
 * and persists each stage to the backend database.
 *
 * raceStatus: 'idle' | 'active' | 'finished'
 */
const useRaceStore = create((set, get) => ({
  raceStatus: 'idle',        // idle → active → finished
  raceType: 'BPT',           // BPT | PPT | CPT | others
  raceCustomName: '',        // filled when raceType === 'others'
  raceStartedAt: null,       // JS Date when race started
  raceSessionId: null,       // UUID returned by the backend — links checkpoints + results

  setRaceType: (type) => set({ raceType: type }),
  setRaceCustomName: (name) => set({ raceCustomName: name }),

  /**
   * 1. Create the race session in the DB  → status: 'pending'
   * 2. Start it                           → status: 'active'
   * 3. Update frontend state
   */
  startRace: async () => {
    const { raceType, raceCustomName } = get();
    const category = raceType === 'others' ? 'others' : raceType;
    const customName = raceType === 'others' ? raceCustomName : '';

    // Step 1: create the session record
    const session = await api.createRace(category, customName);
    if (!session) {
      console.warn('[raceStore] Could not create race session in DB — continuing in offline mode');
      set({ raceStatus: 'active', raceStartedAt: new Date(), raceSessionId: null });
      return;
    }

    // Step 2: start it
    const started = await api.startRace(session.id);
    if (!started) {
      console.warn('[raceStore] Could not start race in DB — continuing with session id only');
    }

    set({
      raceStatus: 'active',
      raceStartedAt: new Date(),
      raceSessionId: session.id,
    });

    console.log('[raceStore] Race started — session id:', session.id);
  },

  /**
   * Finish the race in the DB, which calculates and archives final standings
   * in the race_results table.
   */
  finishRace: async () => {
    const { raceSessionId } = get();

    if (raceSessionId) {
      const result = await api.finishRace(raceSessionId);
      if (result) {
        console.log('[raceStore] Race finished and results archived.');
      } else {
        console.warn('[raceStore] Could not finish race in DB.');
      }
    }

    set({ raceStatus: 'finished' });
  },

  resetRace: () =>
    set({
      raceStatus: 'idle',
      raceStartedAt: null,
      raceSessionId: null,
    }),

  /** Human-readable race label */
  raceLabel: () => {
    const { raceType, raceCustomName } = get();
    return raceType === 'others' && raceCustomName ? raceCustomName : raceType;
  },
}));

export default useRaceStore;
