const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  adminApiKey: required('ADMIN_API_KEY'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  allowVercelAppOrigins: (process.env.CORS_ALLOW_VERCEL_APP_ORIGINS || 'true').toLowerCase() === 'true',
  startingCredits: Number(process.env.DEFAULT_STARTING_CREDITS || 10000),
  defaultLmsrB: Number(process.env.DEFAULT_LMSR_B || 100),
  demoAdminEmail: process.env.DEMO_ADMIN_EMAIL || 'admin@musicx.local',
  demoAdminPassword: process.env.DEMO_ADMIN_PASSWORD || 'ChangeMe123!',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
};

module.exports = { config };
