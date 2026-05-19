const API_URL = 'http://localhost:8000/api/v1';

// ── Generic helper ──────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${options.method || 'GET'} ${path} → ${res.status}: ${body}`);
  }
  // 204 No Content has no body
  return res.status === 204 ? null : res.json();
}

export const api = {
  // ── Runners ──────────────────────────────────────────────────────────────
  verifyRunner: async (armyNumber) => {
    try {
      return await apiFetch(`/verify/${armyNumber}`);
    } catch (err) {
      console.error('[api] verifyRunner:', err.message);
      // Fallback: treat as authorised so the UI doesn't stall
      return { army_number: armyNumber, verified: true, message: 'Authorized (mock fallback)' };
    }
  },

  bulkCreateRunners: async (runners) => {
    try {
      return await apiFetch('/runners/bulk', {
        method: 'POST',
        body: JSON.stringify({ runners }),
      });
    } catch (err) {
      console.error('[api] bulkCreateRunners:', err.message);
      return null;
    }
  },

  // ── Race sessions ─────────────────────────────────────────────────────────
  createRace: async (category, customName = '') => {
    try {
      return await apiFetch('/races/', {
        method: 'POST',
        body: JSON.stringify({ category, custom_name: customName || null }),
      });
    } catch (err) {
      console.error('[api] createRace:', err.message);
      return null;
    }
  },

  startRace: async (raceId) => {
    try {
      return await apiFetch(`/races/${raceId}/start`, { method: 'POST' });
    } catch (err) {
      console.error('[api] startRace:', err.message);
      return null;
    }
  },

  finishRace: async (raceId) => {
    try {
      return await apiFetch(`/races/${raceId}/finish`, { method: 'POST' });
    } catch (err) {
      console.error('[api] finishRace:', err.message);
      return null;
    }
  },

  // ── Checkpoint records ────────────────────────────────────────────────────
  recordCheckpoint: async (rfidTag, checkpoint, isoTime, raceSessionId = null) => {
    try {
      return await apiFetch('/checkpoints/record', {
        method: 'POST',
        body: JSON.stringify({
          rfid_tag: rfidTag,
          checkpoint,
          recorded_at: isoTime,
          race_session_id: raceSessionId,
        }),
      });
    } catch (err) {
      console.error('[api] recordCheckpoint:', err.message);
      return null;
    }
  },
};
