import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function NoteForm({ onAdd }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) return;
    setLoading(true);
    try {
      await onAdd({ title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      setExpanded(false);
    } catch {
      // error handling di parent
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (e) => {
    if (!formRef.current?.contains(e.relatedTarget)) {
      if (title.trim() || content.trim()) handleSubmit();
      else setExpanded(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mb-10 px-4" ref={formRef} onBlur={handleBlur}>
      <motion.div
        layout
        className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
      >
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Judul"
                className="w-full px-4 pt-3 pb-1 font-semibold text-gray-800 placeholder-gray-300 outline-none text-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center px-4 py-3">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            placeholder="Buat catatan..."
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm"
          />
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {expanded && (
          <div className="flex justify-end px-4 pb-3">
            <button
              onClick={handleSubmit}
              disabled={loading || (!title.trim() && !content.trim())}
              className="text-xs px-4 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
