import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import axios from 'axios';
import { ArrowLeft, ArchiveRestore } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import NoteCard from '../components/NoteCard.jsx';

const breakpoints = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1,
};

export default function ArchivePage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArchivedNotes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/notes/archived');
      setNotes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat catatan arsip.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchivedNotes(); }, []);

  const unarchiveNote = async (id) => {
    try {
      const { data } = await axios.put(`/api/notes/${id}`, { is_archived: false });
      setNotes(prev => prev.filter(n => n.id !== id));
      return data;
    } catch (err) {
      setError('Gagal mengembalikan catatan.');
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError('Gagal menghapus catatan.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-8 pb-16 px-4">
        
        <div className="flex items-center gap-5 mb-8">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Arsip</h1>
            <p className="text-sm text-gray-500 mt-1">Catatan yang telah diarsipkan</p>
          </div>
        </div>

        {loading && (
          <p className="text-center text-gray-400 text-sm mt-12">Memuat catatan arsip...</p>
        )}
        {error && (
          <p className="text-center text-red-400 text-sm mt-12">{error}</p>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center mt-24 text-gray-300">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-medium">Belum ada catatan arsip</p>
            <p className="text-sm mt-1">Catatan yang diarsipkan akan muncul di sini</p>
          </div>
        )}

        {notes.length > 0 && (
          <Masonry
            breakpointCols={breakpoints}
            className="flex gap-4"
            columnClassName="flex flex-col"
          >
            <AnimatePresence>
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onUpdate={unarchiveNote}
                  onDelete={deleteNote}
                  onPin={() => {}} 
                  isArchivePage={true}
                />
              ))}
            </AnimatePresence>
          </Masonry>
        )}
      </main>
    </div>
  );
}