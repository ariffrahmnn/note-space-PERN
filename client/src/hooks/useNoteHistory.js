// client/src/hooks/useNoteHistory.js
// Hook baru — tidak mengubah file yang sudah ada

import { useState, useCallback } from 'react';
import axios from 'axios';

export const useNoteHistory = () => {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchHistory = useCallback(async (noteId) => {
    if (!noteId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/notes/${noteId}/history`);
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = () => setHistory([]);

  return { history, loading, error, fetchHistory, clear };
};
