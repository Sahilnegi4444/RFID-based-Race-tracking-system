import { create } from 'zustand';
import { api } from '../services/api';

/**
 * raceStore — controls the race lifecycle state on the frontend
 * and persists each stage to the backend database.
 *
 * raceStatus: 'idle' | 'active' | 'finished'
 *
 * Lifecycle:
 *   1. createRaceSession() → creates DB record, sets raceSessionId, raceStatus stays 'idle'
 *   2. startRace()         → starts the session in DB, raceStatus → 'active'
 *   3. finishRace()        → archives results in DB, raceStatus → 'finished'
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
   * Step 1: Create the race session in the DB (status: 'pending').
   * This is called from the Create Race page. It does NOT start the race.
   * After this, raceSessionId is set and Upload Tags becomes unlocked.
   */
  createRaceSession: async () => {
    const { raceType, raceCustomName } = get();
    const category = raceType === 'others' ? 'others' : raceType;
    const customName = raceType === 'others' ? raceCustomName : '';

    const session = await api.createRace(category, customName);
    if (!session) {
      console.warn('[raceStore] Could not create race session in DB — offline mode');
      // Still mark as created locally so UI unlocks
      set({ raceSessionId: '__offline__' });
      return;
    }

    set({ raceSessionId: session.id });
    console.log('[raceStore] Race session created — id:', session.id);
  },

  /**
   * Load active or pending race session from database.
   * Restores state in the frontend store upon refresh.
   */
  loadActiveRace: async () => {
    try {
      const sessions = await api.listRaces();
      if (!sessions || sessions.length === 0) return;

      // Find the first non-finished session (pending or active)
      const current = sessions.find(s => s.status === 'active' || s.status === 'pending');
      if (current) {
        // Map category back to frontend UI options
        let mappedType = current.category;
        if (mappedType !== 'BPT' && mappedType !== 'PPT' && mappedType !== 'CPT') {
          mappedType = 'others';
        }

        set({
          raceSessionId: current.id,
          raceStatus: current.status === 'active' ? 'active' : 'idle',
          raceType: mappedType,
          raceCustomName: current.custom_name || '',
          raceStartedAt: current.started_at ? new Date(current.started_at) : null,
        });
        console.log('[raceStore] Restored race session state:', current.id, 'status:', current.status);
      } else {
        // Clear stale session state if no active or pending race is found in the DB
        set({
          raceSessionId: null,
          raceStatus: 'idle',
          raceStartedAt: null,
        });
      }
    } catch (err) {
      console.error('[raceStore] Failed to load active race:', err);
    }
  },

  /**
   * Step 2: Start the already-created race session.
   * Called from the Dashboard "Start Race" button.
   */
  startRace: async () => {
    const { raceSessionId } = get();

    if (raceSessionId && raceSessionId !== '__offline__') {
      const started = await api.startRace(raceSessionId);
      if (!started) {
        console.warn('[raceStore] Could not start race in DB — continuing in frontend-only mode');
      }
    } else if (!raceSessionId) {
      // No session yet — create one on the fly (fallback)
      const { raceType, raceCustomName } = get();
      const category = raceType === 'others' ? 'others' : raceType;
      const customName = raceType === 'others' ? raceCustomName : '';
      const session = await api.createRace(category, customName);
      if (session) {
        await api.startRace(session.id);
        set({ raceSessionId: session.id });
      }
    }

    set({
      raceStatus: 'active',
      raceStartedAt: new Date(),
    });

    console.log('[raceStore] Race started');
  },

  /**
   * Step 3: Finish the race in the DB — archives final standings.
   */
  finishRace: async () => {
    const { raceSessionId } = get();

    if (raceSessionId && raceSessionId !== '__offline__') {
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
