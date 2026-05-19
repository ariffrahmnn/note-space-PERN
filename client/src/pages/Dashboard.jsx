import { AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import Navbar from '../components/Navbar.jsx';
import NoteCard from '../components/NoteCard.jsx';
import NoteForm from '../components/NoteForm.jsx';
import { useNotes } from '../hooks/useNotes.js';

const breakpoints = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1,
};

export default function Dashboard() {
  const { notes, loading, error, addNote, updateNote, deleteNote, togglePin } = useNotes();

  const pinned = notes.filter(n => n.is_pinned);
  const others = notes.filter(n => !n.is_pinned);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-8 pb-16 px-4">
        <NoteForm onAdd={addNote} />

        {loading && (
          <p className="text-center text-gray-400 text-sm mt-12">Memuat catatan...</p>
        )}
        {error && (
          <p className="text-center text-red-400 text-sm mt-12">{error}</p>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center mt-24 text-gray-300">
            <p className="text-5xl mb-4">📝</p>
            <p className="text-lg font-medium">Belum ada catatan</p>
            <p className="text-sm mt-1">Buat catatan pertamamu di atas!</p>
          </div>
        )}

        {/* Pinned notes */}
        {pinned.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Disematkan
            </h2>
            <Masonry
              breakpointCols={breakpoints}
              className="flex gap-4"
              columnClassName="flex flex-col"
            >
              <AnimatePresence>
                {pinned.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onPin={togglePin}
                  />
                ))}
              </AnimatePresence>
            </Masonry>
          </section>
        )}

        {/* Other notes */}
        {others.length > 0 && (
          <section>
            {pinned.length > 0 && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Lainnya
              </h2>
            )}
            <Masonry
              breakpointCols={breakpoints}
              className="flex gap-4"
              columnClassName="flex flex-col"
            >
              <AnimatePresence>
                {others.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onPin={togglePin}
                  />
                ))}
              </AnimatePresence>
            </Masonry>
          </section>
        )}
      </main>
    </div>
  );
}
