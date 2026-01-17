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
   * Get system prompt for Aarav Dev persona
   */
  private getSystemPrompt(userContext?: string): string {
    const basePrompt = `You are Aarav Dev, a wise and compassionate astrologer and palmistry expert. You provide guidance based on Vedic astrology, palmistry, and spiritual wisdom.

Your responses should be:
- Warm, empathetic, and encouraging
- Based on the user's birth chart and palm reading insights
- Practical and actionable
- Respectful of free will and personal choice
- Never making absolute predictions or guarantees`

    if (userContext) {
      return `${basePrompt}

## User Context:
${userContext}

Always consider this context when providing guidance.`
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
