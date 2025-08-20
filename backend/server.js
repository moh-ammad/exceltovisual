// server.js
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

// Load environment variables
dotenv.config()

// Validate required environment variables
if (!process.env.ADMIN_INVITE_TOKEN) {
  console.error('❌ Missing ADMIN_INVITE_TOKEN in .env')
  process.exit(1)
}

// App setup
const app = express()
const PORT = process.env.PORT || 5000

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ✅ CORS Configuration
const allowedOrigins = [
  'https://exceltovisual.netlify.app',
  'http://localhost:3000',
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

// Always allow credentials
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// ✅ Connect to DB
connectTodb()

// ✅ Routes
app.get('/', (req, res) => {
  res.send('✅ Backend is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

// ✅ Route Debugging (optional but helpful during crash)
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log('🛣️  Route:', middleware.route.path)
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log('🛣️  Sub-route:', handler.route.path)
      }
    })
  }
})

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
