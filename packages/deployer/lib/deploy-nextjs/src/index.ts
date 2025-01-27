import { execSync } from 'child_process'
import path from 'path'

export interface DeployOptions {
  nextAppPath: string
  host: string
  user: string
  destination: string
  sshKeyPath?: string
  buildCommand?: string
}

export async function deployNextApp(options: DeployOptions) {
  const {
    nextAppPath,
    host,
    user,
    destination,
    sshKeyPath,
    buildCommand = 'npm run build'
  } = options

  try {
    // Step 1: Build the Next.js app
    console.log('Building Next.js app...')
    execSync(buildCommand, {
      cwd: nextAppPath,
      stdio: 'inherit'
    })

    // Step 2: Prepare rsync command
    const outDir = path.join(nextAppPath, '.next')
    const sshOption = sshKeyPath ? `-e "ssh -i ${sshKeyPath}"` : ''
    const rsyncCommand = `rsync -avz --delete ${sshOption} ${outDir}/ ${user}@${host}:${destination}`

    // Step 3: Deploy using rsync
    console.log('Deploying to Lightsail instance...')
    execSync(rsyncCommand, { stdio: 'inherit' })

    console.log('Deployment completed successfully!')
  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
} 