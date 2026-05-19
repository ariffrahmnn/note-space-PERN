import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/notes');
      setNotes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat catatan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (noteData) => {
    const { data } = await axios.post('/api/notes', noteData);
    setNotes(prev => [data, ...prev]);
    return data;
  };

  const updateNote = async (id, updates) => {
    const { data } = await axios.put(`/api/notes/${id}`, updates);
    setNotes(prev => prev.map(n => n.id === id ? data : n));
    return data;
  };

  const deleteNote = async (id) => {
    await axios.delete(`/api/notes/${id}`);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = (id) => {
    const note = notes.find(n => n.id === id);
    return updateNote(id, { is_pinned: !note.is_pinned });
  };

  return { notes, loading, error, addNote, updateNote, deleteNote, togglePin, refetch: fetchNotes };
};
