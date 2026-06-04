import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import collabRoutes from './routes/collabRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pool from './config/db.js';
import passport from 'passport';
import './config/passport.js'; 

dotenv.config({ path: '../.env' });

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL, 
  'http://localhost:5173' 
];

const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan jika origin ada di dalam daftar allowedOrigins, atau jika request tidak memiliki origin (seperti Postman/mobile apps)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(passport.initialize());


app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes/:id', collabRoutes);      
app.use('/api/notifications', notificationRoutes);


app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));


app.use((req, res) => res.status(404).json({ message: `Route ${req.path} tidak ditemukan.` }));

const PORT = process.env.PORT || 5000;


const ensureChecklistColumn = async () => {
  try {
    await pool.query("ALTER TABLE notes ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb;");
    console.log('✅ checklist column ensured on notes table');
  } catch (err) {
    console.error('❌ Failed to ensure checklist column:', err.message);
  }
};


(async () => {
  await ensureChecklistColumn();
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  });
})();
