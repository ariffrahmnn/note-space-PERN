import pg from 'pg'; 
                      
import dotenv from 'dotenv'; 
                              

dotenv.config({ path: '../.env' }); 
                                  

const { Pool } = pg; 
                      

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, 
  
});

pool.on('connect', () => {
  console.log('✅ Terhubung ke PostgreSQL'); 
});

pool.on('error', (err) => {
  console.error('❌ Error koneksi PostgreSQL:', err.message); 
});

export default pool; 
