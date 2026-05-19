// server/controllers/notificationController.js
// Snippet baru — tidak mengubah file yang sudah ada

import pool from '../config/db.js';

// GET /api/notifications
// Ambil semua notifikasi milik user yang login
export const getNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at,
              n.note_collaborator_id,
              u.username AS sender_username
       FROM notifications n
       JOIN users u ON u.id = n.sender_id
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/notifications/:id/respond
// Body: { action: 'accept' | 'reject' }
export const respondToNotification = async (req, res) => {
  const { id: notif_id } = req.params;
  const { action } = req.body;

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'action harus accept atau reject.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ambil notifikasi + validasi pemilik
    const { rows: notifRows } = await client.query(
      `SELECT n.*, nc.owner_id, nc.note_id, nc.role
       FROM notifications n
       LEFT JOIN note_collaborators nc ON nc.id = n.note_collaborator_id
       WHERE n.id = $1 AND n.recipient_id = $2 AND n.type = 'collab_invite'`,
      [notif_id, req.user.id]
    );

    if (notifRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });
    }

    const notif = notifRows[0];
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update status kolaborasi
    await client.query(
      'UPDATE note_collaborators SET status = $1 WHERE id = $2',
      [newStatus, notif.note_collaborator_id]
    );

    // Tandai notifikasi sebagai dibaca
    await client.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [notif_id]
    );

    // Kirim notifikasi balik ke owner
    const responderInfo = await client.query(
      'SELECT username FROM users WHERE id = $1',
      [req.user.id]
    );
    const responderName = responderInfo.rows[0]?.username || 'Seseorang';

    const responseType = action === 'accept' ? 'collab_accepted' : 'collab_rejected';
    const responseMsg = action === 'accept'
      ? `${responderName} menerima undangan kolaborasimu.`
      : `${responderName} menolak undangan kolaborasimu.`;

    await client.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, note_collaborator_id, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [notif.owner_id, req.user.id, responseType, notif.note_collaborator_id, responseMsg]
    );

    await client.query('COMMIT');
    res.json({ message: `Undangan berhasil ${action === 'accept' ? 'diterima' : 'ditolak'}.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('respondToNotification error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// PATCH /api/notifications/read-all
// Tandai semua notifikasi sebagai sudah dibaca
export const markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE recipient_id = $1',
      [req.user.id]
    );
    res.json({ message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    console.error('markAllRead error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
