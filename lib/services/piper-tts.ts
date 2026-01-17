/**
 * Piper TTS Service
 * Free, open-source text-to-speech using Piper
 * https://github.com/rhasspy/piper
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

interface PiperConfig {
  piperPath: string // Path to piper executable
  voiceModelPath: string // Path to voice model (.onnx file)
  outputDir: string // Directory to save audio files
}

class PiperTTSService {
  private config: PiperConfig

  constructor() {
    // Default paths - adjust based on your setup
    this.config = {
      piperPath: process.env.PIPER_PATH || path.join(process.cwd(), 'tools', 'piper', 'piper.exe'),
      voiceModelPath: process.env.PIPER_VOICE_MODEL || path.join(process.cwd(), 'tools', 'piper', 'voices', 'en_US-libritts-high.onnx'),
      outputDir: process.env.PIPER_OUTPUT_DIR || path.join(process.cwd(), 'public', 'audio'),
    }
  }

  /**
   * Check if Piper is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if piper executable exists
      await fs.access(this.config.piperPath)
      // Check if voice model exists
      await fs.access(this.config.voiceModelPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Generate audio file from text
   * @param text Text to convert to speech
   * @param outputFileName Optional custom output filename (without extension)
   * @returns Path to generated audio file (relative to public directory)
   */
  async generateSpeech(
    text: string,
    outputFileName?: string
  ): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new Error(
        'Piper TTS is not available. Please ensure Piper is installed and voice model is configured.'
      )
    }

    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true })

    // Generate unique filename if not provided
    const fileName = outputFileName || `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const outputPath = path.join(this.config.outputDir, `${fileName}.wav`)
    const absoluteOutputPath = path.resolve(outputPath)

    // Clean text (remove newlines and extra spaces)
    const cleanedText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

    // Use absolute paths
    const absolutePiperPath = path.resolve(this.config.piperPath)
    const absoluteModelPath = path.resolve(this.config.voiceModelPath)

    // Verify paths exist
    try {
      await fs.access(absolutePiperPath)
      await fs.access(absoluteModelPath)
    } catch (error) {
      throw new Error(`Piper TTS files not found. Piper: ${absolutePiperPath}, Model: ${absoluteModelPath}`)
    }

    // Use spawn for better Windows compatibility
    const { spawn } = await import('child_process')
    
    try {
      // Spawn Piper process
      const piperProcess = spawn(absolutePiperPath, [
        '--model', absoluteModelPath,
        '--output_file', absoluteOutputPath,
      ], {
        shell: false, // Don't use shell for better control
        cwd: path.dirname(absolutePiperPath), // Run from piper directory
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
      })

      // Collect stderr for logging
      let stderrOutput = ''
      piperProcess.stderr.on('data', (data) => {
        stderrOutput += data.toString()
      })

      // Write text to stdin
      piperProcess.stdin.write(cleanedText, 'utf-8')
      piperProcess.stdin.end()

      // Wait for process to complete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          piperProcess.kill()
          reject(new Error('Piper TTS timeout after 60 seconds'))
        }, 60000)

        piperProcess.on('close', (code) => {
          clearTimeout(timeout)
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`Piper process exited with code ${code}. ${stderrOutput || 'No error details'}`))
          }
        })

        piperProcess.on('error', (error) => {
          clearTimeout(timeout)
          reject(new Error(`Failed to start Piper: ${error.message}`))
        })
      })

      // Log warnings if any
      if (stderrOutput && !stderrOutput.includes('warning')) {
        console.warn('Piper TTS stderr:', stderrOutput)
      }

      // Verify file was created
      await fs.access(absoluteOutputPath)

      // Return relative path from public directory for URL access
      const publicPath = path.relative(path.join(process.cwd(), 'public'), absoluteOutputPath)
      return publicPath.replace(/\\/g, '/') // Normalize path separators
    } catch (error) {
      console.error('Error generating speech with Piper:', error)
      throw new Error(
        `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate speech and return public URL
   */
  async generateSpeechUrl(
    text: string,
    outputFileName?: string
  ): Promise<string> {
    const relativePath = await this.generateSpeech(text, outputFileName)
    // Return URL path (assuming audio files are served from /audio)
    return `/audio/${path.basename(relativePath)}`
  }
}

export const piperTTSService = new PiperTTSService()
