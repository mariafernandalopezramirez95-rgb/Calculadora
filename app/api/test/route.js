import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function GET() {
  const result = await client.execute('SELECT 1 AS connected;');
  return NextResponse.json({ connected: true, result });
}
