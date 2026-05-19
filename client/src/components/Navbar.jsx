import { LogOut, NotebookPen, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <NotebookPen size={22} className="text-yellow-500" />
        <span className="font-semibold text-gray-800 text-base">NoteSpace</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/archive"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-yellow-100 hover:text-yellow-500"
        >
          <Archive size={15} />
          <span className="hidden sm:block">Arsip</span>
        </Link>

        <span className="text-sm text-gray-500 hidden sm:block">{user?.username}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-100"
        >
          <LogOut size={15} />
          <span className="hidden sm:block">Keluar</span>
        </button>
      </div>
    </header>
  );
}
