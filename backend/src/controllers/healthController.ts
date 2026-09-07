import { Request, Response } from 'express'
import { ENV, isSupabaseConfigured } from '../config/env.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getHealth(req: Request, res: Response) {
  let databaseStatus = 'unconfigured'

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        databaseStatus = 'unconfigured'
      } else {
        const { error } = await supabase.from('profiles').select('id').limit(1)
        databaseStatus = error ? (error.message.includes('Could not find the table') ? 'schema_missing' : 'error') : 'connected'
      }
    } catch (error: any) {
      databaseStatus = 'error'
    }
  }

  res.status(200).json({
    status: 'ok',
    service: 'skillbridge-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    supabaseConfigured: isSupabaseConfigured(),
    supabaseUrl: ENV.SUPABASE_URL ? 'configured' : 'missing',
    model: ENV.GEMINI_MODEL,
  })
}
