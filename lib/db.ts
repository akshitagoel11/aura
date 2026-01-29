import { Pool, QueryResult } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('[v0] DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('[v0] Unexpected error on idle client', err);
});

export async function query(text: string, params?: (string | number | boolean | null)[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    console.log('[v0] Executing query:', { text: text.substring(0, 100), params });
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[v0] Query successful', { duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('[v0] Database error:', { error, text: text.substring(0, 100), params });
    throw error;
  }
}

export async function executeTransaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[v0] Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
