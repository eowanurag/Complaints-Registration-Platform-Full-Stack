import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();
console.log('Using URL:', process.env.SUPABASE_URL ? 'YES (Masked)' : 'NO');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SUPABASE_URL || '',
  },
});
