// client/src/components/NotificationBell.jsx
// Tambahkan komponen ini ke Navbar.jsx yang sudah ada

import { useState } from 'react';
import { Bell, Check, X, Users } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function NotificationBell() {
  const { notifications, unreadCount, respond, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleRespond = async (notifId, action) => {
    await respond(notifId, action);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Notifikasi</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <Users size={24} className="mx-auto mb-2 opacity-40" />
                  Belum ada notifikasi
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-50 last:border-0 ${
                      !notif.is_read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-700 leading-snug">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>

                    {/* Tombol terima/tolak hanya untuk undangan yang belum direspons */}
                    {notif.type === 'collab_invite' && !notif.is_read && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleRespond(notif.id, 'accept')}
                          className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600"
                        >
                          <Check size={12} /> Terima
                        </button>
                        <button
                          onClick={() => handleRespond(notif.id, 'reject')}
                          className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                        >
                          <X size={12} /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
