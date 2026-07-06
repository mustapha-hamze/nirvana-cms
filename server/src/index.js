import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import userRoutes from './routes/userRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import pageRoutes from './routes/pageRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import tagRoutes from './routes/tagRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

// Serve uploaded files (icons, etc.)
app.use('/storage', express.static(path.resolve(__dirname, '../storage')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/users', userRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/pages', pageRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagRoutes)

app.use((err, req, res, next) => {
  const status = err.status || 500
  const message = status < 500 ? err.message : 'Internal server error'
  if (status >= 500) console.error(err)
  res.status(status).json({ message })
})

async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

start()
