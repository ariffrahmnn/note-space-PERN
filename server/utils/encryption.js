



import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    
const TAG_LENGTH = 16;   



const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY harus tepat 32 karakter di .env');
  }
  return Buffer.from(key, 'utf8');
};


export const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, encrypted, authTag].map(b => b.toString('base64')).join(':');
};


export const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  
  if (!ciphertext.includes(':')) return ciphertext;
  const [ivB64, encB64, tagB64] = ciphertext.split(':');
  const iv         = Buffer.from(ivB64, 'base64');
  const encrypted  = Buffer.from(encB64, 'base64');
  const authTag    = Buffer.from(tagB64, 'base64');
  const decipher   = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
