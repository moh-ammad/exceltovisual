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

const app = express()

// Connect to MongoDB
connectTodb()

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://exceltocharts.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serving static uploads folder will NOT work on Vercel
// You must use a cloud storage solution like AWS S3 or Cloudinary.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

// Export the app instance for Vercel to use as a serverless function
export default app

// Remove the following lines as they are for a traditional server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`)
// })
// process.on('unhandledRejection', ...)
// process.on('uncaughtException', ...)