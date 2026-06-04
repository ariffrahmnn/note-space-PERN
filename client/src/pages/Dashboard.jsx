import Navbar from '../components/Navbar.jsx';
import NoteCard from '../components/NoteCard.jsx';
import NoteForm from '../components/NoteForm.jsx';
import { useNotes } from '../hooks/useNotes.js';

export default function Dashboard() {
  const { notes, loading, error, addNote, updateNote, deleteNote, togglePin } = useNotes();

  const pinned = notes.filter(n => n.is_pinned);
  const others = notes.filter(n => !n.is_pinned);

  const NoteGrid = ({ items }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
      {items.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onPin={togglePin}
        />
      ))}
    </div>
  );

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

        {pinned.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Disematkan
            </h2>
            <NoteGrid items={pinned} />
          </section>
        )}

        {others.length > 0 && (
          <section>
            {pinned.length > 0 && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Lainnya
              </h2>
            )}
            <NoteGrid items={others} />
          </section>
        )}
      </main>
    </div>
  );
}
