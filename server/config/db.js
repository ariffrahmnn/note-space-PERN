import pg from 'pg'; // ini adalah library untuk mengkonek kan node js dengan postgre yang
                      // aku buat dengan npm install pg
import dotenv from 'dotenv'; // ini adalah librarry yng memungkinkan aku untuk mengakses 
                              //variabel lingkungan dari file .env yang aku buat dengan npm install dotenv

dotenv.config({ path: '../.env' }); //nah disini kita mengkonfigurasi library dot env supaya dia bisa membaca .env 
                                  //yang dimana isinya ada database url yang akan kita gunakan

const { Pool } = pg; //disini kita membuat koneksi "pool" ke db kita, supaya dia dapat mengelola beberapaa koneksi sekaligus dengan
                      //efisien, supaya kita tidak perlu melakukan koneksi baru setiap kali kita ingin interaksi dengan db

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // connectionString ini adalah url yang diambil dari .env kita, dan membuat penulisan url database menadi lebih mudah karna hanya satu baris saja
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // tanda tanya disitu adalah ternary operator, fungsinya kaya if-else tapi lebih singkat aja
  // ini adalah konfigurasi untuk koneksi ssl, jadi disini projectnya akan di cek dalam proses apa? jika dia dalam production maka aktifkan fitur ini, jika tidak silahkan matikan dan akses secara lokal
});

pool.on('connect', () => {
  console.log('✅ Terhubung ke PostgreSQL'); // ini adalan eventlistener kalau misalnya db terkneksi dengan baik
});

pool.on('error', (err) => {
  console.error('❌ Error koneksi PostgreSQL:', err.message); // ini adalan eventlistener kalau misalnya db gagal terkoneksi
});

export default pool; // ini untuk import supaya bisa di pakek ke file lain
