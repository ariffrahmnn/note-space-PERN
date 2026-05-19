import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Palette, Archive } from 'lucide-react';

// Palet warna pastel Google Keep
const COLORS = [
  { hex: '#ffffff', label: 'Default' },
  { hex: '#faafa8', label: 'Flamingo' },
  { hex: '#f39f76', label: 'Tangerine' },
  { hex: '#fff8b8', label: 'Banana' },
  { hex: '#e2f6d3', label: 'Sage' },
  { hex: '#b4ddd3', label: 'Teal' },
  { hex: '#d4e4ed', label: 'Denim' },
  { hex: '#aeccdc', label: 'Cerulean' },
  { hex: '#d3bfdb', label: 'Grape' },
  { hex: '#f6e2dd', label: 'Blush' },
  { hex: '#e9e3d4', label: 'Sand' },
  { hex: '#efeff1', label: 'Fog' },
];

export default function NoteCard({ note, onUpdate, onDelete, onPin, isArchivePage = false }) {
  const [showPalette, setShowPalette] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleColorChange = (hex) => {
    onUpdate(note.id, { background_color: hex });
    setShowPalette(false);
  };

  const handleSave = () => {
    if (editTitle !== note.title || editContent !== note.content) {
      onUpdate(note.id, { title: editTitle, content: editContent });
    }
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl border border-gray-200 p-4 mb-4 note-card-hover cursor-pointer"
      style={{ backgroundColor: note.background_color || '#ffffff' }}
      onClick={() => !showPalette && setEditing(true)}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <Pin size={14} className="absolute top-3 right-3 text-gray-500 fill-gray-400" />
      )}

      {/* Content */}
      {editing ? (
        <div onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Judul"
            className="w-full bg-transparent font-semibold text-gray-800 placeholder-gray-400 outline-none mb-2 text-sm"
          />
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="Buat catatan..."
            rows={4}
            className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none resize-none text-sm leading-relaxed"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
            >
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <>
          {note.title && (
            <h3 className="font-courier font-bold text-gray-800 text-sm mb-1 pr-5">{note.title}</h3>
          )}
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{note.content}</p>
        </>
      )}

      {/* Action toolbar */}
      <div
        className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        {/* Palette */}
        <div className="relative">
          <button
            onClick={() => setShowPalette(p => !p)}
            className="p-1.5 rounded-full hover:bg-black/10 text-gray-500"
            title="Ubah warna"
          >
            <Palette size={15} />
          </button>
          {showPalette && (
            <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-10 flex flex-wrap gap-1 w-40">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => handleColorChange(c.hex)}
                  className="w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: note.background_color === c.hex ? '#1a73e8' : '#e5e7eb',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pin */}
        <button
          onClick={() => onPin(note.id)}
          className={`p-1.5 rounded-full hover:bg-black/10 ${note.is_pinned ? 'text-blue-500' : 'text-gray-500'}`}
          title={note.is_pinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={15} />
        </button>

        {/* Archive/Unarchive */}
        <button
          onClick={() => onUpdate(note.id, { is_archived: !note.is_archived })}
          className="p-1.5 rounded-full hover:bg-black/10 text-gray-500"
          title={isArchivePage ? 'Kembalikan dari arsip' : 'Arsipkan'}
        >
          <Archive size={15} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(note.id)}
          className="p-1.5 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500 ml-auto"
          title="Hapus"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}
