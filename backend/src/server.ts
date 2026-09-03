import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { ENV } from './config/env.js'
import apiRoutes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ENV.FRONTEND_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV === 'development'
      ) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-mode'],
  })
)

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Mount all API routes under /api
app.use('/api', apiRoutes)

// Fallback 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  })
})

// Centralized error handler
app.use(errorHandler)

const PORT = ENV.PORT || 5000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SkillBridge Backend] Server running on port ${PORT} (env: ${ENV.NODE_ENV})`)
    console.log(`[SkillBridge Backend] Health check available at: http://localhost:${PORT}/api/health`)
  })
}

export default app
