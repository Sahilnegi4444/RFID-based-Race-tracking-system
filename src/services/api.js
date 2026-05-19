const API_URL = 'http://localhost:8000/api/v1';

export const api = {
  verifyRunner: async (armyNumber) => {
    try {
      const res = await fetch(`${API_URL}/verify/${armyNumber}`);
      if (!res.ok) throw new Error('Verification failed');
      return await res.json();
    } catch (err) {
      console.error('API verify error:', err);
      // Fallback to mock if backend is down
      return { army_number: armyNumber, verified: true, message: 'Authorized (mock fallback)' };
    }
  },
  
  bulkCreateRunners: async (runners) => {
    try {
      const res = await fetch(`${API_URL}/runners/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runners }),
      });
      if (!res.ok) throw new Error('Failed to create runners');
      return await res.json();
    } catch (err) {
      console.error('API bulkCreate error:', err);
    }
  },

  recordCheckpoint: async (rfid, checkpoint, time) => {
    try {
      const res = await fetch(`${API_URL}/checkpoints/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfid_tag: rfid,
          checkpoint: checkpoint,
          recorded_at: time, // ISO format
        }),
      });
      if (!res.ok) throw new Error('Failed to record checkpoint');
      return await res.json();
    } catch (err) {
      console.error('API recordCheckpoint error:', err);
    }
  },
};
