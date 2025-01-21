import { deployNextApp } from '../lib/deploy-nextjs/src'
import 'dotenv/config'

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_APP_HOST',
  'NEXT_APP_USER',
  'NEXT_APP_DESTINATION',
  'NEXT_APP_SSH_KEY_PATH'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

deployNextApp({
  nextAppPath: process.cwd(),
  host: process.env.NEXT_APP_HOST as string,
  user: process.env.NEXT_APP_USER as string,
  destination: process.env.NEXT_APP_DESTINATION as string,
  sshKeyPath: process.env.NEXT_APP_SSH_KEY_PATH as string,
  buildCommand: 'npm run build'
}) 