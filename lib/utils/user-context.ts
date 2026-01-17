/**
 * Helper to build user context string from profile data
 */

interface UserProfile {
  birth_summary?: string | null
  palm_summary?: string | null
  key_insights?: string[] | null
  date_of_birth?: string | null
  place_of_birth?: string | null
  time_of_birth?: string | null
  preferred_language?: string | null
}

/**
 * Build context string from user profile
 */
export function buildUserContext(profile: UserProfile | null): string {
  if (!profile) {
    return 'No profile information available yet.'
  }

  const sections: string[] = []

  if (profile.birth_summary) {
    sections.push(`## Birth Chart Summary\n${profile.birth_summary}`)
  }

  if (profile.palm_summary) {
    sections.push(`## Palm Reading Summary\n${profile.palm_summary}`)
  }

  if (profile.key_insights && profile.key_insights.length > 0) {
    sections.push(
      `## Key Insights\n${profile.key_insights.map((insight) => `- ${insight}`).join('\n')}`
    )
  }

  if (profile.date_of_birth || profile.place_of_birth || profile.time_of_birth) {
    sections.push(
      `## Birth Details\n- Date: ${profile.date_of_birth || 'Not provided'}\n- Time: ${profile.time_of_birth || 'Not provided'}\n- Place: ${profile.place_of_birth || 'Not provided'}`
    )
  }

  return sections.join('\n\n') || 'No profile information available yet.'
}
