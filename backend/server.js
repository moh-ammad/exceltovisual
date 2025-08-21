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

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://exceltovisual.netlify.app'
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps or curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    } else {
      return callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ✅ Handle preflight requests
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}))

// ✅ (Optional) Set headers manually for extra protection
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

// ✅ Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ✅ Connect to DB
connectTodb()

// ✅ Routes
app.get('/', (req, res) => {
  res.send('Backend is running')
})

// Test CORS route
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!', origin: req.headers.origin })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
