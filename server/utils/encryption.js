// server/utils/encryption.js
// Enkripsi AES-256-GCM di sisi server menggunakan modul crypto bawaan Node.js
// (tidak perlu install library tambahan)

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // 12 bytes untuk GCM
const TAG_LENGTH = 16;   // auth tag 16 bytes

// Ambil kunci dari .env — harus 32 karakter (256-bit)
// Tambahkan di .env: ENCRYPTION_KEY=32_karakter_string_acak_aman!!
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY harus tepat 32 karakter di .env');
  }
  return Buffer.from(key, 'utf8');
};

/**
 * Enkripsi string teks biasa
 * Output format: iv:ciphertext:authTag (semua base64)
 */
export const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, encrypted, authTag].map(b => b.toString('base64')).join(':');
};

/**
 * Dekripsi ciphertext
 * Input format: iv:ciphertext:authTag (semua base64)
 */
export const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  // Jika belum dienkripsi (data lama), kembalikan apa adanya
  if (!ciphertext.includes(':')) return ciphertext;
  const [ivB64, encB64, tagB64] = ciphertext.split(':');
  const iv         = Buffer.from(ivB64, 'base64');
  const encrypted  = Buffer.from(encB64, 'base64');
  const authTag    = Buffer.from(tagB64, 'base64');
  const decipher   = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
