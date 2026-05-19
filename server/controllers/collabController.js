// server/controllers/collabController.js
// Snippet baru — tidak mengubah file yang sudah ada

import pool from '../config/db.js';
import { decrypt } from '../utils/encryption.js';

// POST /api/notes/:id/invite
// Body: { invitee_id, role: 'viewer'|'editor' }
export const inviteCollaborator = async (req, res) => {
  const { id: note_id } = req.params;
  const { invitee_id, role = 'viewer' } = req.body;
  const owner_id = req.user.id;

  if (!invitee_id) {
    return res.status(400).json({ message: 'invitee_id wajib diisi.' });
  }
  if (!['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ message: 'Role harus viewer atau editor.' });
  }
  if (invitee_id === owner_id) {
    return res.status(400).json({ message: 'Tidak bisa mengundang diri sendiri.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifikasi catatan milik owner
    const noteCheck = await client.query(
      'SELECT id, title, is_encrypted FROM notes WHERE id = $1 AND user_id = $2',
      [note_id, owner_id]
    );
    if (noteCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Catatan tidak ditemukan atau bukan milikmu.' });
    }

    // Verifikasi invitee exist
    const inviteeCheck = await client.query(
      'SELECT id, username FROM users WHERE id = $1',
      [invitee_id]
    );
    if (inviteeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const invitee = inviteeCheck.rows[0];
    const note = noteCheck.rows[0];
    const noteTitle = note.is_encrypted
      ? decrypt(note.title)
      : note.title || 'Catatan tanpa judul';

    // Insert kolaborasi (ON CONFLICT update role jika sudah ada)
    const { rows: collabRows } = await client.query(
      `INSERT INTO note_collaborators (note_id, owner_id, invitee_id, role, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (note_id, invitee_id)
         DO UPDATE SET role = EXCLUDED.role, status = 'pending'
       RETURNING *`,
      [note_id, owner_id, invitee_id, role]
    );

    const collab = collabRows[0];

    // Buat notifikasi untuk invitee
    const senderInfo = await client.query(
      'SELECT username FROM users WHERE id = $1',
      [owner_id]
    );
    const senderName = senderInfo.rows[0]?.username || 'Seseorang';

    await client.query(
      `INSERT INTO notifications
         (recipient_id, sender_id, type, note_collaborator_id, message)
       VALUES ($1, $2, 'collab_invite', $3, $4)`,
      [
        invitee_id,
        owner_id,
        collab.id,
        `${senderName} mengundang kamu untuk berkolaborasi di catatan "${noteTitle}" sebagai ${role}.`,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: `Undangan berhasil dikirim ke ${invitee.username}.`, collab });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('inviteCollaborator error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// GET /api/notes/:id/collaborators
export const getCollaborators = async (req, res) => {
  const { id: note_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT nc.id, nc.role, nc.status,
              u.username, u.email
       FROM note_collaborators nc
       JOIN users u ON u.id = nc.invitee_id
       WHERE nc.note_id = $1
         AND (nc.owner_id = $2 OR nc.invitee_id = $2)`,
      [note_id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getCollaborators error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/notes/:noteId/collaborators/:collabId
export const removeCollaborator = async (req, res) => {
  const { noteId, collabId } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM note_collaborators
       WHERE id = $1 AND note_id = $2 AND owner_id = $3`,
      [collabId, noteId, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Kolaborator tidak ditemukan.' });
    }
    res.json({ message: 'Kolaborator dihapus.' });
  } catch (err) {
    console.error('removeCollaborator error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
