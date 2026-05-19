import pool from '../config/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// 2. Ganti fungsi createNote — enkripsi title & content sebelum simpan
export const createNote = async (req, res) => {
  const { title = '', content = '', background_color = '#ffffff' } = req.body;

  if (!content && !title) {
    return res.status(400).json({ message: 'Catatan tidak boleh kosong.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO notes (user_id, title, content, background_color, is_encrypted)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [req.user.id, encrypt(title), encrypt(content), background_color]  // <-- enkripsi di sini
    );

    // Kembalikan data dalam bentuk plain text (sudah didekripsi) ke client
    const note = rows[0];
    res.status(201).json({
      ...note,
      title:   decrypt(note.title),
      content: decrypt(note.content),
    });
  } catch (err) {
    console.error('createNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 3. Ganti fungsi getNotes — dekripsi saat mengambil data
export const getNotes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         n.*,
         -- flag apakah ini catatan milik sendiri atau kolaborasi
         CASE WHEN n.user_id = $1::uuid THEN true ELSE false END AS is_owner,
         -- role user di catatan ini (null kalau milik sendiri)
         nc.role AS collab_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id
         AND nc.invitee_id = $1::uuid
         AND nc.status = 'accepted'       -- hanya yang sudah di-accept
       WHERE n.is_archived = false
         AND (
           n.user_id = $1::uuid                 -- catatan milik sendiri
           OR nc.invitee_id = $1::uuid          -- ATAU catatan yang diterima via kolaborasi
         )
       ORDER BY n.is_pinned DESC, n.created_at DESC`,
      [req.user.id]
    );

    // Dekripsi sebelum kirim ke client
    const decrypted = rows.map(note => ({
      ...note,
      title:   note.is_encrypted ? decrypt(note.title)   : note.title,
      content: note.is_encrypted ? decrypt(note.content) : note.content,
    }));

    res.json(decrypted);
  } catch (err) {
    console.error('getNotes error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getArchivedNotes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         n.*,
         CASE WHEN n.user_id = $1::uuid THEN true ELSE false END AS is_owner,
         nc.role AS collab_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id
         AND nc.invitee_id = $1::uuid
         AND nc.status = 'accepted'
       WHERE n.is_archived = true
         AND (
           n.user_id = $1::uuid
           OR nc.invitee_id = $1::uuid
         )
       ORDER BY n.updated_at DESC`,
      [req.user.id]
    );

    const decrypted = rows.map(note => ({
      ...note,
      title:   note.is_encrypted ? decrypt(note.title)   : note.title,
      content: note.is_encrypted ? decrypt(note.content) : note.content,
    }));

    res.json(decrypted);
  } catch (err) {
    console.error('getArchivedNotes error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};


// 4. Ganti fungsi updateNote — enkripsi juga saat update
export const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content, background_color, is_pinned, is_archived } = req.body;
  const userId = req.user.id;

  try {
    // Cek apakah user adalah owner ATAU editor yang accepted
    const accessCheck = await pool.query(
      `SELECT n.id, n.user_id,
              CASE WHEN n.user_id = $1::uuid THEN 'owner'
                   ELSE nc.role
              END AS user_role
       FROM notes n
       LEFT JOIN note_collaborators nc
         ON nc.note_id = n.id
         AND nc.invitee_id = $1::uuid
         AND nc.status = 'accepted'
       WHERE n.id = $2::uuid
         AND (n.user_id = $1::uuid OR nc.invitee_id = $1::uuid)`,
      [userId, id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }

    const { user_role } = accessCheck.rows[0];

    // Viewer tidak boleh edit konten
    if (user_role === 'viewer') {
      return res.status(403).json({ message: 'Kamu hanya bisa melihat catatan ini.' });
    }

    // Owner bisa ubah semua field, editor hanya title/content, semua kolaborator boleh pin
    const isOwner = user_role === 'owner';

    if (!isOwner && background_color !== undefined) {
      return res.status(403).json({ message: 'Hanya owner yang dapat mengubah warna catatan.' });
    }

    const { rows } = await pool.query(
      `WITH updated AS (
         UPDATE notes
         SET
           title            = COALESCE($1, title),
           content          = COALESCE($2, content),
           background_color = COALESCE($3, background_color),
           is_pinned        = COALESCE($4, is_pinned),
           is_archived      = COALESCE($5, is_archived),
           is_encrypted     = true
         WHERE id = $6::uuid
         RETURNING *
       )
       SELECT u.*, 
              CASE WHEN u.user_id = $1 THEN true ELSE false END AS is_owner,
              CASE WHEN u.user_id = $1 THEN NULL ELSE nc.role END AS collab_role
       FROM updated u
       LEFT JOIN note_collaborators nc
         ON nc.note_id = u.id
         AND nc.invitee_id = $1
         AND nc.status = 'accepted'`,
      [
        title   !== undefined ? encrypt(title)   : null,
        content !== undefined ? encrypt(content) : null,
        background_color,
        is_pinned !== undefined ? is_pinned : null,
        isOwner ? is_archived : null,   // hanya owner bisa archive
        id,
      ]
    );

    const note = rows[0];
    res.json({
      ...note,
      title:   decrypt(note.title),
      content: decrypt(note.content),
    });
  } catch (err) {
    console.error('updateNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      // WHERE user_id = $2 sudah memastikan hanya owner
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        message: 'Catatan tidak ditemukan atau kamu bukan pemiliknya.',
      });
    }
    res.json({ message: 'Catatan dihapus.' });
  } catch (err) {
    console.error('deleteNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
