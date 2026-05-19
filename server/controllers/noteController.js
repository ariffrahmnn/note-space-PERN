import pool from '../config/db.js';

// GET /api/notes
export const getNotes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notes
       WHERE user_id = $1 AND is_archived = false
       ORDER BY is_pinned DESC, created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getNotes error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getArchivedNotes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notes
       WHERE user_id = $1 AND is_archived = true
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getArchivedNotes error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/notes
export const createNote = async (req, res) => {
  const { title = '', content = '', background_color = '#ffffff' } = req.body;

  if (!content && !title) {
    return res.status(400).json({ message: 'Catatan tidak boleh kosong.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO notes (user_id, title, content, background_color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, title, content, background_color]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notes/:id
export const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content, background_color, is_pinned, is_archived } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE notes
       SET
         title            = COALESCE($1, title),
         content          = COALESCE($2, content),
         background_color = COALESCE($3, background_color),
         is_pinned        = COALESCE($4, is_pinned),
         is_archived      = COALESCE($5, is_archived)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, content, background_color, is_pinned, is_archived, id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }
    res.json({ message: 'Catatan dihapus.' });
  } catch (err) {
    console.error('deleteNote error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
