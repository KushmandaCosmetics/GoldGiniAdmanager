import mysql from 'mysql2/promise';

// Read-only connection to the existing ecomm2 database
const pool = mysql.createPool({
  uri: process.env.ECOMM2_DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function queryEcommDb(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
