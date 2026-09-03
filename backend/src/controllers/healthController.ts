import { Request, Response } from 'express'
import { isSupabaseConfigured } from '../config/env.js'

export function getHealth(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    service: 'skillbridge-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: isSupabaseConfigured() ? 'connected' : 'unconfigured_fallback',
  })
}
