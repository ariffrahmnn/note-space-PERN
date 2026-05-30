import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Palette, Archive, Users } from 'lucide-react';
import FocusModal from './FocusModal.jsx';
import CollabModal from './CollabModal.jsx';
import ConfirmCard from './ConfirmCard.jsx';

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

const handlePreviewClick = (e) => {
  const tag = e.target.closest('a');
  if (tag) {
    e.stopPropagation();
    window.open(tag.href, '_blank', 'noopener,noreferrer');
    e.preventDefault();
  }
};

export default function NoteCard({ note, onUpdate, onDelete, onPin }) {
  const [showPalette, setShowPalette] = useState(false);
  const [showFocus,   setShowFocus]   = useState(false);
  const [showCollab,  setShowCollab]  = useState(false);

  // Inject checklist styles for preview rendering (if not already present)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('deNotes-task-styles')) return;
    const css = `
    .task-list { list-style: none; padding-left: 0; }
    .task-item { display: flex; align-items: center; gap: 0.5rem; }
    .task-item .task-checkbox, .task-item input[type="checkbox"] { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 6px; border: 2px solid #cbd5e1; background: white; display: inline-grid; place-items: center; }
    .task-item .task-checkbox:checked, .task-item input[type="checkbox"]:checked { background: #2563eb; border-color: #2563eb; }
    .task-item .task-checkbox:checked::after, .task-item input[type="checkbox"]:checked::after { content: ''; width: 8px; height: 5px; border-left: 2px solid white; border-bottom: 2px solid white; transform: rotate(-45deg); display: block; }
    .task-item .task-text, .task-item label > span, .task-item label > p { display: inline-block; }
    .task-item .task-checkbox:checked + .task-text, .task-item input[type="checkbox"]:checked + .task-text, .task-item input[type="checkbox"]:checked + span { text-decoration: line-through; color: #6b7280; opacity: 0.6; }
    .checked-item { text-decoration: line-through; opacity: 0.6; }
    .checked-item span { opacity: 0.6; }
  `;
    const style = document.createElement('style');
    style.id = 'deNotes-task-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }, []);

  const isOwner = note.is_owner !== false;
  const canEdit = isOwner || note.collab_role === 'editor';
  const isHTML  = typeof note.content === 'string' && note.content.trimStart().startsWith('<');
  const checklistItems = Array.isArray(note.checklist) ? note.checklist : [];

  const handleToggleChecklist = (itemId, checked) => {
    if (!canEdit) return;
    const nextChecklist = checklistItems.map(item =>
      item.id === itemId ? { ...item, done: checked } : item
    );
    onUpdate(note.id, { checklist: nextChecklist });
  };

  const handleColorChange = (hex) => {
    onUpdate(note.id, { background_color: hex });
    setShowPalette(false);
  };

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const isCollaborator = !isOwner && note.collab_role != null;

  const handleDeleteClick = () => {
    if (isCollaborator) {
      setShowLeaveConfirm(true);
      return;
    }
    onDelete(note.id, false);
  };

  return (
    <>
      <motion.div
        // HAPUS layout={true} — layout prop override ukuran grid
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}

        // w-full mengisi lebar kolom grid, overflow-hidden cegah konten meluber
        className="w-full group relative rounded-2xl border border-gray-200 p-4 overflow-hidden
                   transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        style={{ backgroundColor: note.background_color || '#ffffff' }}
        onClick={() => !showPalette && setShowFocus(true)}
      >
        {note.is_pinned && (
          <Pin size={14} className="absolute top-3 right-3 text-gray-500 fill-gray-400" />
        )}

        {!isOwner && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 mb-1.5
                           rounded-full bg-blue-50 text-blue-500 border border-blue-100">
            <Users size={9} /> Shared · {note.collab_role}
          </span>
        )}

        {note.title && (
          <h3 className="font-semibold text-gray-800 text-sm mb-1.5 pr-5 line-clamp-2">
            {note.title}
          </h3>
        )}

        {note.content && (
          isHTML ? (
            <div
              onClick={handlePreviewClick}
              className="prose prose-sm max-w-none text-gray-600 overflow-hidden
                         [&_img]:max-h-40 [&_img]:w-full [&_img]:object-cover [&_img]:rounded-lg [&_img]:my-1
                         [&_a]:text-blue-500 [&_a]:underline
                         [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold
                         line-clamp-[6]"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {note.content}
            </p>
          )
        )}

        {checklistItems.length > 0 && (
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {checklistItems.map(item => (
              <label key={item.id} className="flex items-start gap-2 transition-all duration-300">
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={!canEdit}
                  onChange={e => handleToggleChecklist(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-300"
                />
                <span className={`transition-all duration-300 ${item.done ? 'line-through opacity-50 text-gray-500' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div
          className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowPalette(p => !p)}
                className="p-1.5 rounded-full hover:bg-black/10 text-gray-500"
                title="Ubah warna"
              >
                <Palette size={15} />
              </button>
              {showPalette && (
                <div className="absolute bottom-8 left-0 z-10 bg-white border border-gray-200
                                rounded-xl shadow-xl p-2 flex flex-wrap gap-1 w-40">
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
          )}

          {isOwner && (
            <button type="button" onClick={() => onPin(note.id)}
              className={`p-1.5 rounded-full hover:bg-black/10 ${note.is_pinned ? 'text-blue-500' : 'text-gray-500'}`}
              title={note.is_pinned ? 'Unpin' : 'Pin'}>
              <Pin size={15} />
            </button>
          )}

          {isOwner && (
            <button type="button" onClick={() => onUpdate(note.id, { is_archived: true })}
              className="p-1.5 rounded-full hover:bg-black/10 text-gray-500" title="Arsipkan">
              <Archive size={15} />
            </button>
          )}

          {isOwner && (
            <button type="button" onClick={() => setShowCollab(true)}
              className="p-1.5 rounded-full hover:bg-black/10 text-gray-500" title="Undang kolaborator">
              <Users size={15} />
            </button>
          )}

          {!canEdit && (
            <span className="text-[11px] text-gray-400 ml-1 select-none">Hanya lihat</span>
          )}

          {(isOwner || isCollaborator) && (
            <button type="button" onClick={handleDeleteClick}
              className="p-1.5 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500 ml-auto"
              title={isCollaborator ? 'Keluar dari kolaborasi' : 'Hapus'}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {showFocus && (
        <FocusModal note={note} canEdit={canEdit}
          onClose={() => setShowFocus(false)} onSave={(id, u) => onUpdate(id, u)} />
      )}
      {showCollab && (
        <CollabModal note={note} onClose={() => setShowCollab(false)} />
      )}

      {showLeaveConfirm && (
        <ConfirmCard
          message={`Kamu akan berhenti berkolaborasi pada catatan ini. Pemilik akan diberi tahu dan catatan akan hilang dari daftarmu.`}
          onCancel={() => setShowLeaveConfirm(false)}
          onConfirm={() => { setShowLeaveConfirm(false); onDelete(note.id, true); }}
          confirmLabel="Keluar"
          cancelLabel="Batal"
          type="error"
        />
      )}
    </>
  );
}

// (Styles are injected inside the component to avoid invalid hook calls.)
