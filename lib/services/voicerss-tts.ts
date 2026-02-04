/**
 * VoiceRSS Text-to-Speech Service
 * Cloud-based TTS API - no local setup required
 * https://www.voicerss.org/
 */

interface VoiceRSSConfig {
  apiKey: string
  language: string // Language code (e.g., 'en-in', 'en-us')
  format?: string // Audio format: 'mp3', 'wav', 'aac', 'ogg', 'caf'
  speed?: number // Speech speed: -10 to 10 (default: 0)
  voice?: string // Voice name (optional, depends on language)
}

class VoiceRSSTTSService {
  private config: VoiceRSSConfig

  constructor() {
    this.config = {
      apiKey: process.env.VOICE_RSS_API_KEY || '',
      language: process.env.VOICE_RSS_LANGUAGE || 'en-us', // Default to en-us
      format: '16khz_16bit_stereo', // Fixed format: 16kHz, 16-bit, stereo
      speed: parseInt(process.env.VOICE_RSS_SPEED || '0', 10),
    }
  }

  /**
   * Check if VoiceRSS is configured
   */
  isAvailable(): boolean {
    return !!this.config.apiKey && this.config.apiKey.trim() !== ''
  }

  /**
   * Generate VoiceRSS API URL for text-to-speech
   * Returns a direct URL to the MP3 audio file
   * 
   * @param text Text to convert to speech
   * @returns URL to the generated audio file
   */
  generateSpeechUrl(text: string, language?: string): string {
    if (!this.isAvailable()) {
      throw new Error(
        'VoiceRSS API key is not configured. Please set VOICE_RSS_API_KEY in your environment variables.'
      )
    }

    // Clean text (remove newlines and extra spaces, encode for URL)
    const cleanedText = text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanedText || cleanedText.length === 0) {
      throw new Error('Text cannot be empty')
    }

    // VoiceRSS has a character limit (usually 100KB or ~10,000 characters)
    // Truncate if necessary
    const maxLength = 10000
    const truncatedText = cleanedText.length > maxLength
      ? cleanedText.substring(0, maxLength) + '...'
      : cleanedText

    // Build VoiceRSS API URL with proper format
    // Format: http://api.voicerss.org/?key=KEY&hl=en-us&c=MP3&f=16khz_16bit_stereo&src=TEXT
    const baseUrl = 'http://api.voicerss.org/'
    const params = new URLSearchParams({
      key: this.config.apiKey,
      hl: language || this.config.language, // Use provided language or default
      c: 'MP3', // Codec
      f: '16khz_16bit_stereo', // Format: 16kHz, 16-bit, stereo
      src: truncatedText,
    })

    // Add speed/rate parameter if specified (optional)
    if (this.config.speed && this.config.speed !== 0) {
      params.append('r', String(this.config.speed))
    }

    // Add voice parameter if specified (optional)
    if (process.env.VOICE_RSS_VOICE) {
      params.append('v', process.env.VOICE_RSS_VOICE)
    }

    const audioUrl = `${baseUrl}?${params.toString()}`

    return audioUrl
  }

  /**
   * Generate speech URL (alias for generateSpeechUrl for consistency)
   */
  async generateSpeechUrlAsync(text: string, language?: string): Promise<string> {
    return this.generateSpeechUrl(text, language)
  }
}

export const voiceRSSTTSService = new VoiceRSSTTSService()
