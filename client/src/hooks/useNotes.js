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
    try {
      // Validasi bahwa content (jika ada) bukan undefined
      if (updates.content === undefined) {
        console.warn('updateNote: content is undefined, akan gunakan nilai lama');
        delete updates.content;  // Jangan kirim undefined
      } else {
        // Debug: log content yang dikirim
        console.log('[updateNote] Mengirim content:', {
          length: updates.content.length,
          hasImage: updates.content.includes('<img'),
          preview: updates.content.substring(0, 100),
        });
      }
      
      const { data } = await axios.put(`/api/notes/${id}`, updates);
      
      // Pastikan response valid sebelum update state
      if (!data || !data.id) {
        throw new Error('Invalid response from server');
      }
      
      // Debug: log response content
      console.log('[updateNote Response]', {
        contentLength: data.content?.length || 0,
        hasImage: data.content?.includes('<img') || false,
        contentPreview: data.content?.substring(0, 100) || 'empty',
      });
      
      setNotes(prev => {
        if (data.is_archived) {
          return prev.filter(n => n.id !== id);
        }
        return prev.map(n => n.id === id ? data : n);
      });
      return data;
    } catch (err) {
      console.error('updateNote error:', err);
      throw err;
    }
  };

  const deleteNote = async (id, isCollaborator = false) => {
    try {
      if (isCollaborator) {
        await axios.delete(`/api/notes/${id}/leave`);
      } else {
        await axios.delete(`/api/notes/${id}`);
      }
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus catatan.');
    }
  };

  const togglePin = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return null;

    try {
      return await updateNote(id, { is_pinned: !note.is_pinned });
    } catch (err) {
      console.error('togglePin error:', err);
      setError(err.response?.data?.message || 'Gagal menyematkan catatan.');
      return null;
    }
  };

  return { notes, loading, error, addNote, updateNote, deleteNote, togglePin, refetch: fetchNotes };
};
