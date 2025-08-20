import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRoutes } from './routes/authRoutes.js'
import connectTodb from './config/db.js'
import { userRoutes } from './routes/userRoutes.js'
import { taskRoutes } from './routes/taskRoutes.js'
import { reportRoutes } from './routes/reportRoutes.js'
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config()
const PORT = process.env.PORT || 5000

const app=express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'https://exceltovisual.netlify.app'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

// Extra headers & OPTIONS handler - make preflight explicit and robust for CDNs/proxies
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
    'https://exceltovisual.netlify.app'
  ];

  const origin = req.headers.origin;
  // Log origin for debugging (comment out in production if noisy)
  console.log('[CORS] incoming origin ->', origin);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    // short-circuit preflight requests
    return res.sendStatus(204);
  }

  next();
});

connectTodb()
app.get('/', (req, res) => {
  res.send('Backend is running');
});
// routes
app.use('/api/auth',authRoutes)
app.use('/api/users',userRoutes)
app.use('/api/tasks',taskRoutes)
app.use('/api/reports',reportRoutes)



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})



