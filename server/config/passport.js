import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db.js';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("❌ ERROR: GOOGLE_CLIENT_ID atau SECRET tidak ditemukan di .env!");
}
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://note-space-pern-production.up.railway.app/api/auth/google/callback",
    passReqToCallback: true  
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
     
      const user = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
      
      if (user.rows.length > 0) return done(null, user.rows[0]);

      const newUser = await pool.query(
        'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) RETURNING *',
        [profile.displayName, profile.emails[0].value, profile.id]
      );
      return done(null, newUser.rows[0]);
    } catch (err) {
      return done(err, null);
    }
  }
));