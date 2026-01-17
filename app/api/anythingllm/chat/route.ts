import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { anythingLLMService } from '@/lib/services/anythingllm'
import {
  fetchUserContext,
  generateImageSignedUrls,
  formatUserContextForLLM,
} from '@/lib/services/user-context'
import { analyzeAllPalmImages } from '@/lib/services/vision-api'

/**
 * POST /api/anythingllm/chat
 * Chat with AnythingLLM using direct data injection (no RAG)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get workspace ID
    let { data: workspace, error: workspaceError } = await supabase
      .from('anythingllm_workspaces')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    // If workspace doesn't exist in DB or is invalid, create it
    if (!workspace || !workspace.workspace_id || workspace.workspace_id === 'null' || workspace.workspace_id === 'undefined') {
      try {
        // Get user name for workspace
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single()

        const userName = userData?.name || userData?.email?.split('@')[0] || 'User'
        
        // Create new workspace
        const newWorkspaceId = await anythingLLMService.createWorkspace(user.id, userName)

        // Save to database
        if (workspace) {
          await supabase
            .from('anythingllm_workspaces')
            .update({ workspace_id: newWorkspaceId })
            .eq('user_id', user.id)
        } else {
          await supabase
            .from('anythingllm_workspaces')
            .insert({ user_id: user.id, workspace_id: newWorkspaceId })
        }

        workspace = { workspace_id: newWorkspaceId }
      } catch (createError) {
        console.error('Error creating workspace:', createError)
        return NextResponse.json(
          { error: 'Failed to create workspace. Please ensure AnythingLLM is running and API key is configured.' },
          { status: 500 }
        )
      }
    }

    // Extract numeric ID from workspace_id (might be in format "id:slug" or just "id")
    let numericWorkspaceId = workspace.workspace_id
    if (workspace.workspace_id.includes(':')) {
      numericWorkspaceId = workspace.workspace_id.split(':')[0]
    }

    // Verify workspace exists in AnythingLLM (non-blocking - chat will handle if missing)
    // Only verify if we have a numeric ID, don't recreate unnecessarily
    if (/^\d+$/.test(numericWorkspaceId)) {
      const workspaceExists = await anythingLLMService.getWorkspace(numericWorkspaceId)
      if (!workspaceExists) {
        console.warn(`Workspace ${numericWorkspaceId} not found in AnythingLLM, but will use it anyway (chat will handle)`)
        // Don't recreate - use existing workspace ID, chat method will handle it
      } else {
        console.log(`✅ Workspace ${numericWorkspaceId} verified in AnythingLLM`)
      }
    } else {
      console.warn(`Workspace ID format might be invalid: ${workspace.workspace_id}, will use as-is`)
    }

    // Step 1: Fetch user context from database
    const userContext = await fetchUserContext(user.id)

    // Step 2: Generate signed URLs for palm images and analyze them
    let palmDescriptions: Map<string, string> = new Map()
    if (userContext.palmImages.length > 0) {
      try {
        const imagesWithUrls = await generateImageSignedUrls(userContext.palmImages)
        palmDescriptions = await analyzeAllPalmImages(imagesWithUrls)
      } catch (error) {
        console.error('Error analyzing palm images:', error)
        // Continue without palm descriptions if analysis fails
      }
    }

    // Step 3: Build enhanced system prompt with injected context
    const contextText = formatUserContextForLLM(userContext, palmDescriptions)
    const systemPrompt = `You are Aarav Dev, a wise and compassionate astrologer and palmistry expert. You are a real human palmist providing personalized readings to clients.

CRITICAL RESPONSE RULES:
- Answer ONLY what the user asked - nothing more, nothing less
- Keep responses SHORT: 4-6 concise sentences maximum
- NO greetings ("Dear...", "Hello...", etc.) - start directly with the answer
- NO closing lines, signatures, or farewells
- NO disclaimers like "for more accuracy consult an astrologer" or "this is just guidance"
- NO extra advice unless explicitly asked
- NO fancy language, summaries, or unrelated explanations
- Write in a normal conversational tone - as if speaking directly to the person
- Use "you" and "your" naturally
- Base your answer on the user's birth details and palm reading insights provided
- Be direct and to the point - answer the core question only

Example:
User: "How is the next one year looking for me?"
Good: "Based on your birth chart, the next year shows significant growth in your career. You'll see opportunities around mid-year that align with your natural talents. Financial stability will improve, especially in the second half. Relationships will deepen, and you may find new meaningful connections. Overall, it's a transformative period for you."

Bad: "Dear user, based on your palm reading and birth details, I can see that... [long explanation]... For more detailed analysis, please consult a professional astrologer. Best regards, Aarav Dev."

Remember: Answer the question directly, concisely, and naturally - like a palmist speaking to a client.`

    // Inject user context directly into the message for better reliability
    // Some LLM modes don't properly use system prompts, so we prepend context to message
    const messageWithContext = `USER CONTEXT INFORMATION:
${contextText}

---
USER QUESTION: ${message}

Answer ONLY what the user asked. Keep it short (4-6 sentences), direct, and conversational. NO greetings, NO closing lines, NO disclaimers, NO extra advice. Just answer the question naturally based on their birth details and palm reading.`

    console.log(`📝 Sending message with context (${contextText.length} chars of context)`)

    // Step 4: Get recent Q&A history (last 20 messages)
    const { data: recentQuestions } = await supabase
      .from('questions')
      .select('text_original, answers(text)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Build chat history from recent Q&A
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role || 'user',
      content: msg.content || '',
    }))

    // Add recent Q&A to history if not already included
    if (recentQuestions && recentQuestions.length > 0) {
      for (const q of recentQuestions.reverse()) {
        chatHistory.push({
          role: 'user' as const,
          content: q.text_original || '',
        })
        if (q.answers && q.answers.length > 0) {
          chatHistory.push({
            role: 'assistant' as const,
            content: q.answers[0].text || '',
          })
        }
      }
    }

    // Step 5: Chat with AnythingLLM (direct injection, no RAG)
    const response = await anythingLLMService.chat(
      workspace.workspace_id,
      messageWithContext, // Message with context prepended
      systemPrompt, // System prompt for persona
      chatHistory.slice(-20) // Last 20 messages
    )

    // Clean up response: Remove any greetings, signatures, disclaimers, or closing phrases
    let cleanedResponse = response.response || ''
    cleanedResponse = cleanedResponse
      // Remove greetings at start
      .replace(/^(Dear\s+[^,\n]+|Hello\s+[^,\n]+|Hi\s+[^,\n]+|Greetings\s*[,\n])/i, '')
      // Remove closing signatures and phrases
      .replace(/\n*(Best regards|Sincerely|Regards|Thank you|Thanks|Yours truly|Yours sincerely|Assistant Name|Aarav Dev|\[Assistant Name\]|\[Your Name\]).*$/i, '')
      .replace(/\n*---\s*\n*(Best regards|Sincerely|Regards|Thank you|Thanks).*$/i, '')
      .replace(/\n*^(Best regards|Sincerely|Regards|Thank you|Thanks|Assistant Name|\[Assistant Name\]).*$/im, '')
      // Remove common disclaimers
      .replace(/\n*(For more (detailed|accurate|precise) (analysis|guidance|consultation|reading),?\s*(please\s+)?(consult|see|visit|contact)\s+(a\s+)?(professional|expert|qualified)\s+(astrologer|palmist|palmistry expert|practitioner).*?)/i, '')
      .replace(/\n*(This is (just|only|merely) (a|an) (guidance|general|basic) (reading|analysis|prediction|insight).*?)/i, '')
      .replace(/\n*(Please note that.*?(consult|professional|expert).*?)/i, '')
      .replace(/\n*(For (better|more) (accuracy|precision|details).*?(consult|professional|expert).*?)/i, '')
      .trim()

    return NextResponse.json({
      response: cleanedResponse,
      sources: response.sources || [],
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      {
        error: 'Failed to get response',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
