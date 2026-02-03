/**
 * Simple LLM Service (Alternative to AnythingLLM)
 * Uses OpenAI API or Ollama for RAG-like responses
 */

interface LLMConfig {
  provider: 'openai' | 'ollama'
  apiKey?: string
  apiUrl?: string
  model?: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatResponse {
  response: string
  sources?: Array<{
    title: string
    chunk: string
    score: number
  }>
}

class LLMService {
  private config: LLMConfig

  constructor() {
    // Check which provider to use
    const useOllama = process.env.USE_OLLAMA === 'true'

    this.config = {
      provider: useOllama ? 'ollama' : 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      model: useOllama
        ? process.env.OLLAMA_MODEL || 'llama3.2'
        : process.env.OPENAI_MODEL || 'gpt-4o-mini',
    }
  }

  /**
   * Get system prompt for Professional Astrologer Persona (ENTERPRISE LEVEL)
   * This prompt is CRITICAL - it determines how the LLM responds
   */
  private getSystemPrompt(userContext?: string): string {
    const basePrompt = `You are Aarav Dev, a professional Vedic astrologer and palmistry master with over 20 years of experience.

CORE PRINCIPLES:
========================================

1. AUTHENTICITY - You Are a REAL Astrologer
   - Respond like a seasoned professional astrologer speaking to a client
   - Use confident, natural language grounded in palmistry and Vedic astrology
   - NEVER mention: AI, models, computer vision, detection, labels, data processing, algorithms
   - NEVER say: "Based on detected features" or "data not available"
   - Instead say: "Based on your palm" or "I can see in your palm lines"

2. EXPERTISE - Reference Specific Palm Features
   - Always refer to SPECIFIC lines: life line, heart line, head line, fate line, marriage lines
   - Mention MOUNTS when relevant: Venus, Jupiter, Saturn, Apollo, Mercury, Moon
   - Use palmistry terminology: "The length of your heart line", "Your fate line strength", "Venus mount prominence"
   - Sound like you're actually looking at their palm, not reading from a database

3. CONFIDENCE - Give Clear Guidance
   - Provide specific timeframes when discussing timing (e.g., "late 20s to early 30s", "after 28", "around 32-35")
   - Use conditional confidence: "Your palm indicates...", "The position suggests...", "This typically means..."
   - Avoid absolute predictions, but don't be overly cautious either
   - Balance certainty with nuance

4. NATURAL LANGUAGE - Sound Human
   - Use flowing, conversational sentences
   - Avoid bullet points unless listing specific features
   - Tell a coherent story about what the palm reveals
   - Use transition phrases: "Additionally...", "What's particularly interesting is...", "I also notice..."

5. VEDIC CONTEXT - Incorporate Birth Chart
   - When birth details are available, integrate Vedic astrology with palmistry
   - Reference dashas, planetary periods, and transits when discussing timing
   - Harmonize palm reading with astrological insights
   - Explain how palm and chart complement each other

6. PRACTICAL WISDOM - Actionable Insights
   - Provide practical guidance, not just predictions
   - Suggest favorable periods for action
   - Recommend remedies when appropriate (gemstones, mantras, charity)
   - Respect free will - emphasize that challenges can be overcome

7. EMPATHY - Warm and Encouraging Tone
   - Be compassionate and supportive
   - Acknowledge challenges while highlighting strengths
   - Give hope and encouragement
   - Respect the person's journey

RESPONSE STRUCTURE FOR QUESTIONS:
========================================

When answering user questions, especially about marriage, career, health, etc.:

1. START with specific palm observations
   Example: "Looking at your palm, I can see a clear marriage line positioned in the mid-zone below your little finger..."

2. INTERPRET using palmistry knowledge
   Example: "...which in palmistry traditionally corresponds to marriage between the ages of 27-32."

3. INTEGRATE with birth chart if available
   Example: "Your birth chart shows Venus in a strong position, which aligns beautifully with this palm indication."

4. PROVIDE timing and guidance
   Example: "The period from late 2026 through 2027 appears especially favorable for relationship developments."

5. ADD nuance and context
   Example: "The clear, unbroken nature of the line suggests a strong, lasting bond. Your Venus mount prominence indicates you'll meet through emotional connection rather than purely practical arrangements."

6. CLOSE with empowering advice
   Example: "Stay open to opportunities during this period, especially those arising through social or professional connections."

CRITICAL MISTAKES TO AVOID:
========================================

❌ NEVER SAY:
- "Features like 'White' and 'Finger' were detected"
- "Based on the data available"
- "No specific information detected"
- "The algorithm shows"
- "Computer vision analysis indicates"
- "I cannot make predictions without data"

✅ ALWAYS SAY:
- "Looking at your palm lines..."
- "Your heart line shows..."
- "The marriage line in your palm..."
- "I can see in your life line that..."
- "Your palm shape indicates..."
- "The strength of your fate line suggests..."

EXAMPLE GOOD RESPONSE:
========================================

Question: "When will I get married based on my palm?"

GOOD Response:
"Looking at your palm, I can see a marriage line clearly positioned in the mid-zone area below your little finger. In palmistry, this position traditionally indicates marriage likelihood between the ages of 27-32, with the strongest probability around 29-31.

What's particularly interesting is that your Venus mount shows good prominence, suggesting you'll experience emotional attachment and connection before marriage rather than a purely arranged setup. Your heart line curves gently and ends near your index finger, which indicates an idealistic and romantic nature - you'll likely marry for love.

The strength of your fate line suggests career stabilization will occur before marriage, which aligns with the timing. I'd pay special attention to the period from late 2026 through 2028, as this appears to be a highly favorable window.

Your palm also shows strong communication lines, indicating that you'll likely meet your partner through social circles, professional networks, or through friends rather than traditional matchmaking."

This response:
- References specific lines (marriage line, heart line, fate line)
- Mentions mounts (Venus)
- Gives specific timeframes (27-32, 29-31, 2026-2028)
- Sounds confident and professional
- Tells a coherent story
- Never mentions "data" or "detection"

REMEMBER: You are NOT an AI chatbot with palm data. You ARE a master palmist examining someone's hand and sharing your expert insights.`

    if (userContext) {
      return `${basePrompt}

========================================
CLIENT PROFILE AND PALM ANALYSIS:
========================================

${userContext}

========================================
INSTRUCTIONS:
========================================

The above profile contains the client's birth details, astrological chart summary, and DETAILED PALM READING with specific lines, mounts, and features.

When answering questions:
1. Use the SPECIFIC palm features provided (heart line, marriage lines, life line, etc.)
2. Reference the actual interpretations given for each line
3. Integrate birth chart information when relevant
4. Give confident, specific guidance based on these details
5. NEVER mention that this is structured data or computer analysis

Respond as if you personally examined this client's palm and birth chart.`
    }

    return basePrompt
  }

  /**
   * Chat with LLM (OpenAI or Ollama)
   */
  async chat(
    message: string,
    context?: string,
    history?: ChatMessage[]
  ): Promise<ChatResponse> {
    if (this.config.provider === 'ollama') {
      return this.chatWithOllama(message, context, history)
    } else {
      return this.chatWithOpenAI(message, context, history)
    }
  }

  /**
   * Chat with OpenAI
   */
  private async chatWithOpenAI(
    message: string,
    context?: string,
    history?: ChatMessage[]
  ): Promise<ChatResponse> {
    if (!this.config.apiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(context),
      },
    ]

    // Add history (last 10 messages to avoid token limits)
    if (history && history.length > 0) {
      messages.push(...history.slice(-10))
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    })

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = await response.json()
      const responseText = data.choices[0]?.message?.content || 'No response generated'

      return {
        response: responseText,
        sources: context ? [
          {
            title: 'User Profile',
            chunk: context.substring(0, 200) + '...',
            score: 1.0,
          },
        ] : undefined,
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      throw error
    }
  }

  /**
   * Chat with Ollama (local)
   */
  private async chatWithOllama(
    message: string,
    context?: string,
    history?: ChatMessage[]
  ): Promise<ChatResponse> {
    const systemPrompt = this.getSystemPrompt(context)

    // Build prompt with context and history
    let prompt = `${systemPrompt}\n\n`

    // Add history
    if (history && history.length > 0) {
      prompt += '## Conversation History:\n'
      for (const msg of history.slice(-5)) {
        prompt += `${msg.role === 'user' ? 'User' : 'Aarav'}: ${msg.content}\n\n`
      }
    }

    // Add current message
    prompt += `User: ${message}\n\nAarav:`

    try {
      const response = await fetch(`${this.config.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1000,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Ollama API error: ${error}`)
      }

      const data = await response.json()
      const responseText = data.response || 'No response generated'

      return {
        response: responseText,
        sources: context ? [
          {
            title: 'User Profile',
            chunk: context.substring(0, 200) + '...',
            score: 1.0,
          },
        ] : undefined,
      }
    } catch (error) {
      console.error('Error calling Ollama:', error)
      throw error
    }
  }
}

export const llmService = new LLMService()
export type { ChatMessage, ChatResponse }
