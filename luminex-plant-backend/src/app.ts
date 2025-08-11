import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware'
import { apiLimiter } from './middleware/rateLimiter.middleware'

// Import routes
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import speciesRoutes from './routes/species.routes'
import zoneRoutes from './routes/zone.routes'
import batchRoutes from './routes/batch.routes'
import measurementRoutes from './routes/measurement.routes'
import analyticsRoutes from './routes/analytics.routes'

const app = express()

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Compression middleware
app.use(compression())

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use('/api/', apiLimiter)

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LuminexPlant API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/species', speciesRoutes)
app.use('/api/zones', zoneRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/measurements', measurementRoutes)
app.use('/api/analytics', analyticsRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
