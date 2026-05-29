// client/src/components/CollabModal.jsx
// Modal undang kolaborator — bisa dipanggil dari NoteCard

import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader } from 'lucide-react';
import { useUserSearch } from '../hooks/useUserSearch.js';

export default function CollabModal({ note, onClose }) {
  const { results, loading, error, search, invite, clear } = useUserSearch();
  const [query, setQuery]   = useState('');
  const [role, setRole]     = useState('viewer');
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }

  // Debounce pencarian
  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleInvite = async (userId, username) => {
    setStatus(null);
    try {
      await invite(note.id, userId, role);
      setStatus({ type: 'success', msg: `Undangan berhasil dikirim ke ${username}!` });
      setQuery('');
      clear();
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal mengirim undangan.' });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Undang Kolaborator</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Catatan:{' '}
          {note.title && /<[^>]+>/.test(note.title) ? (
            <span
              className="font-medium text-gray-600"
              dangerouslySetInnerHTML={{ __html: note.title }}
            />
          ) : (
            <span className="font-medium text-gray-600">{note.title || 'Tanpa judul'}</span>
          )}
        </p>

        {/* Role selector */}
        <div className="flex gap-2 mb-4">
          {['viewer', 'editor'].map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors capitalize ${
                role === r
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {r === 'viewer' ? '👁 Viewer' : '✏️ Editor'}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari username atau email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
          {loading && (
            <Loader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Status message */}
        {status && (
          <p className={`text-xs mb-3 px-3 py-2 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-500'
          }`}>
            {status.msg}
          </p>
        )}

        {/* Error */}
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {/* Search results */}
        {results.length > 0 && (
          <ul className="border border-gray-100 rounded-xl overflow-hidden">
            {results.map(user => (
              <li
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => handleInvite(user.id, user.username)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 flex-shrink-0"
                >
                  <UserPlus size={12} /> Undang
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <p className="text-center text-sm text-gray-400 py-4">
            Tidak ada user yang cocok dengan "<span className="font-medium">{query}</span>"
          </p>
        )}
      </div>
    </div>
  );
}
