import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

async function resetDevDatabase() {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    console.error('[SAFETY ERROR] Cannot run database reset script in production environment!');
    process.exit(1);
  }

  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/mikrotik_billing?schema=public';

  console.log('[Dev DB Reset] Target database:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('[Dev DB Reset] Dropping schema public CASCADE...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    console.log('[Dev DB Reset] Recreating clean schema public...');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('[Dev DB Reset] Clean database reset completed successfully.');
  } catch (err: any) {
    console.error('[Dev DB Reset] Error resetting database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDevDatabase();
