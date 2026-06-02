


import pool from '../config/db.js';


export const searchUsers = async (req, res) => {
  const { search } = req.query;

  if (!search || search.trim().length < 2) {
    return res.status(400).json({ message: 'Masukkan minimal 2 karakter untuk pencarian.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1)
         AND id != $2
       LIMIT 10`,
      [`%${search.trim()}%`, req.user.id]
    );

    
    res.json(rows);
  } catch (err) {
    console.error('searchUsers error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
