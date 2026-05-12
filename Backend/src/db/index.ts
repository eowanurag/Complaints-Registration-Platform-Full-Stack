import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.SUPABASE_URL;

if (!connectionString) {
  console.error("SUPABASE_URL is not set in environment variables.");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString as string, { prepare: false });
export const db = drizzle(client);
