


import { useState, useCallback } from 'react';
import axios from 'axios';

export const useUserSearch = () => {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/users', { params: { search: query.trim() } });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Pencarian gagal.');
    } finally {
      setLoading(false);
    }
  }, []);

  const invite = async (noteId, inviteeId, role = 'viewer') => {
    const { data } = await axios.post(`/api/notes/${noteId}/invite`, { invitee_id: inviteeId, role });
    return data;
  };

  const clear = () => setResults([]);

  return { results, loading, error, search, invite, clear };
};
