import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import collabRoutes from './routes/collabRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pool from './config/db.js';

dotenv.config({ path: '../.env' });

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes/:id', collabRoutes);      // merge params sudah di-handle di collabRoutes
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.path} tidak ditemukan.` }));

const PORT = process.env.PORT || 5000;

// Ensure DB schema/migrations: add checklist column if it's missing.
const ensureChecklistColumn = async () => {
  try {
    await pool.query("ALTER TABLE notes ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb;");
    console.log('✅ checklist column ensured on notes table');
  } catch (err) {
    console.error('❌ Failed to ensure checklist column:', err.message);
  }
};

// Start server after ensuring schema
(async () => {
  await ensureChecklistColumn();
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  });
})();
