// server/controllers/noteController.js
// Versi lengkap — ganti seluruh file ini

import pool from '../config/db.js';

// ─── Helper: catat history ───────────────────────────────────────────────────
const logHistory = (client, note_id, user_id, action) =>
  client.query(
    'INSERT INTO note_histories (note_id, user_id, action) VALUES ($1, $2, $3)',
    [note_id, user_id, action]
  );

// Bandingkan field lama vs baru, hasilkan deskripsi perubahan
const buildActionText = (old, next) => {
  const changes = [];
  if (next.title     !== undefined && next.title     !== old.title)            changes.push('mengubah judul');
  if (next.content   !== undefined && next.content   !== old.content)          changes.push('mengubah isi catatan');
  if (next.background_color !== undefined && next.background_color !== old.background_color) changes.push('mengubah warna');
  if (next.is_pinned !== undefined && next.is_pinned !== old.is_pinned)        changes.push(next.is_pinned ? 'menyematkan catatan' : 'membatalkan sematan');
  if (next.is_archived !== undefined && next.is_archived !== old.is_archived)  changes.push(next.is_archived ? 'mengarsipkan catatan' : 'memulihkan dari arsip');
  return changes.length ? changes.join(', ') : 'memperbarui catatan';
};

// ─── GET /api/notes ──────────────────────────────────────────────────────────
export const getNotes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         n.*,
         CASE WHEN n.user_id = $1 THEN true ELSE false END AS is_owner,
         nc.role AS collab_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id
         AND nc.invitee_id = $1
         AND nc.status = 'accepted'
       WHERE n.is_archived = false
         AND (n.user_id = $1 OR nc.invitee_id = $1)
       ORDER BY n.is_pinned DESC, n.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getNotes error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/notes/archived ───────────────────────────────────────────────
export const getArchivedNotes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         n.*,
         CASE WHEN n.user_id = $1 THEN true ELSE false END AS is_owner,
         nc.role AS collab_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id
         AND nc.invitee_id = $1
         AND nc.status = 'accepted'
       WHERE n.is_archived = true
         AND (n.user_id = $1 OR nc.invitee_id = $1)
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getArchivedNotes error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /api/notes ─────────────────────────────────────────────────────────
export const createNote = async (req, res) => {
  const { title = '', content = '', background_color = '#ffffff', checklist = [] } = req.body;

  if (!content && !title && (!Array.isArray(checklist) || checklist.length === 0)) {
    return res.status(400).json({ message: 'Catatan tidak boleh kosong.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO notes (user_id, title, content, checklist, background_color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, content, checklist, background_color]
    );
    const note = rows[0];

    await logHistory(client, note.id, req.user.id, 'membuat catatan baru');

    await client.query('COMMIT');
    res.status(201).json(note);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── PUT /api/notes/:id ──────────────────────────────────────────────────────
export const updateNote = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { title, content, checklist, background_color, is_pinned, is_archived } = updates;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const accessCheck = await client.query(
      `SELECT n.*,
              CASE WHEN n.user_id = $1 THEN 'owner' ELSE nc.role END AS user_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id AND nc.invitee_id = $1 AND nc.status = 'accepted'
       WHERE n.id = $2 AND (n.user_id = $1 OR nc.invitee_id = $1)`,
      [req.user.id, id]
    );

    if (accessCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }

    const oldNote   = accessCheck.rows[0];
    const user_role = oldNote.user_role;
    const isOwner   = user_role === 'owner';

    if (user_role === 'viewer') {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Kamu hanya bisa melihat catatan ini.' });
    }

    const actionText = buildActionText(oldNote, updates);

    // Hanya update field yang explisit dikirim — hindari mengganti dengan NULL
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (title !== undefined && title !== null) {
      updateFields.push(`title = $${paramCount++}`);
      updateValues.push(title);
    }
    if (content !== undefined && content !== null) {
      updateFields.push(`content = $${paramCount++}`);
      updateValues.push(content);
    }
    if (background_color !== undefined && background_color !== null) {
      updateFields.push(`background_color = $${paramCount++}`);
      updateValues.push(background_color);
    }
    if (checklist !== undefined && checklist !== null) {
      updateFields.push(`checklist = $${paramCount++}`);
      updateValues.push(checklist);
    }
    if (isOwner && is_pinned !== undefined && is_pinned !== null) {
      updateFields.push(`is_pinned = $${paramCount++}`);
      updateValues.push(is_pinned);
    }
    if (isOwner && is_archived !== undefined && is_archived !== null) {
      updateFields.push(`is_archived = $${paramCount++}`);
      updateValues.push(is_archived);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await client.query(
        `UPDATE notes SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
        updateValues
      );
    }

    const { rows: updatedRows } = await client.query(
      `SELECT
         n.id,
         n.user_id,
         n.title,
         n.content,
         n.checklist,
         n.background_color,
         n.is_pinned,
         n.is_archived,
         n.created_at,
         n.updated_at,
         CASE WHEN n.user_id = $1 THEN true ELSE false END AS is_owner,
         nc.role AS collab_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id
         AND nc.invitee_id = $1
         AND nc.status = 'accepted'
       WHERE n.id = $2`,
      [req.user.id, id]
    );

    await logHistory(client, id, req.user.id, actionText);

    await client.query('COMMIT');
    res.json(updatedRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── DELETE /api/notes/:id ───────────────────────────────────────────────────
export const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Catatan tidak ditemukan atau bukan milikmu.' });
    }
    res.json({ message: 'Catatan dihapus.' });
  } catch (err) {
    console.error('deleteNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/notes/:id/history ─────────────────────────────────────────────
export const getNoteHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const access = await pool.query(
      `SELECT n.id FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id AND nc.invitee_id = $1 AND nc.status = 'accepted'
       WHERE n.id = $2 AND (n.user_id = $1 OR nc.invitee_id = $1)`,
      [req.user.id, id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }

    const { rows } = await pool.query(
      `SELECT nh.id, nh.action, nh.created_at, u.username AS changed_by
       FROM note_histories nh
       JOIN users u ON u.id = nh.user_id
       WHERE nh.note_id = $1
       ORDER BY nh.created_at DESC
       LIMIT 50`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getNoteHistory error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
