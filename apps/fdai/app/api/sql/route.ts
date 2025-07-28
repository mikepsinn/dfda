import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { files } = await request.json()
    
    if (!Array.isArray(files)) {
      return NextResponse.json({ error: 'Files must be an array' }, { status: 400 })
    }

    const sqlContents = files.map(filePath => {
      try {
        const fullPath = path.join(process.cwd(), filePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        return { path: filePath, content, error: null }
      } catch (error) {
        console.error(`Error loading SQL file ${filePath}:`, error)
        return { path: filePath, content: null, error: 'File not found or cannot be read' }
      }
    })

    return NextResponse.json({ files: sqlContents })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
} 