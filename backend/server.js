import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'  
import { fileURLToPath } from 'url'

import connectTodb from './config/db.js'
import { authRoutes } from './routes/authRoutes.js'
import { userRoutes } from './routes/userRoutes.js'
import { taskRoutes } from './routes/taskRoutes.js'
import { reportRoutes } from './routes/reportRoutes.js'

dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()

// Trust proxy if behind one (e.g., Vercel)
app.set('trust proxy', 1)

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://exceltocharts.vercel.app',   // <-- Your deployed frontend URL (use https)
]



// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static uploads folder
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB
connectTodb()

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)


// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}))

// CORS test route (optional)
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!', origin: req.headers.origin })
})

// Global error handlers for unhandled promise rejections and exceptions
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message)
  process.exit(1)
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})



