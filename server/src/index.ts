import 'dotenv/config'
import { createApp } from './app.js'
import { connectDB } from './config/db.js'

const PORT = process.env.PORT || 5001

async function start() {
  await connectDB()
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

start()
