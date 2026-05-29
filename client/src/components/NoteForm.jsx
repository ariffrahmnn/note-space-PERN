import { useState } from 'react';
import { Plus } from 'lucide-react';
import FocusModal from './FocusModal.jsx';

export default function NoteForm({ onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleSave = async (_, updates) => {
    setLoading(true);
    try {
      await onAdd({
        title: updates.title?.trim() || '',
        content: updates.content?.trim() || '',
      });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mb-10 px-4">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full bg-white rounded-2xl shadow-md border border-gray-200 p-4 text-left hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 grid place-items-center rounded-full bg-yellow-300 text-gray">
            <Plus size={18} />
          </span>
          <div>
            <p className="text-sm font-light text-gray-500">Buat catatan baru</p>
          </div>
        </div>
      </button>

      {showModal && (
        <FocusModal
          note={{ title: '', content: '' }}
          canEdit={true}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
