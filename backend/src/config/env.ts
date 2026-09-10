import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

function loadProjectEnv() {
  const candidates = new Set<string>()
  const cwd = process.cwd()

  for (const dir of [cwd, path.join(cwd, 'backend'), path.resolve(cwd, '..')]) {
    candidates.add(path.join(dir, '.env'))
    candidates.add(path.join(dir, '.env.local'))
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false })
    }
  }

  // Ensure root-level or backend-level .env.local overrides when present
  const localOverrides = [
    path.join(cwd, '.env.local'),
    path.join(cwd, 'backend', '.env.local'),
    path.resolve(cwd, '..', '.env.local'),
  ]
  for (const loc of localOverrides) {
    if (fs.existsSync(loc)) {
      dotenv.config({ path: loc, override: true })
    }
  }
}

loadProjectEnv()

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  FRONTEND_URLS: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),

  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
}

export function isSupabaseConfigured(): boolean {
  const hasUrl = Boolean(
    ENV.SUPABASE_URL &&
    ENV.SUPABASE_URL.startsWith('http') &&
    !ENV.SUPABASE_URL.includes('your-project') &&
    !ENV.SUPABASE_URL.includes('placeholder')
  )
  const hasAnon = Boolean(
    ENV.SUPABASE_ANON_KEY &&
    !ENV.SUPABASE_ANON_KEY.includes('your-anon-key') &&
    !ENV.SUPABASE_ANON_KEY.includes('placeholder')
  )
  const hasServiceRole = Boolean(
    ENV.SUPABASE_SERVICE_ROLE_KEY &&
    !ENV.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key') &&
    !ENV.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  )

  return hasUrl && hasAnon && hasServiceRole
}
