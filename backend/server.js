import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import connectTodb from './config/db.js'
import { authRoutes } from './routes/authRoutes.js'
import { userRoutes } from './routes/userRoutes.js'
import { taskRoutes } from './routes/taskRoutes.js'
import { reportRoutes } from './routes/reportRoutes.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = [
  process.env.CLIENT_URL,      // e.g. https://your.netlify.app
  'http://localhost:3000'
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

// Explicit OPTIONS handlers to ensure preflight success
['/api/auth', '/api/users', '/api/tasks', '/api/reports'].forEach(route => {
  app.options(route, cors(corsOptions))
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Optional security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV !== 'production'
}))

// Serve uploads if needed
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

connectTodb()

app.get('/', (req, res) => res.send('Backend is running'))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

app.get('/api/test-cors', (req, res) =>
  res.json({ message: 'CORS is working!', origin: req.headers.origin })
)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
