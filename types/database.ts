// Database types matching Supabase schema

export type PalmType = 'right_front' | 'left_front' | 'right_side' | 'left_side'
export type MatchingStatus = 'pending' | 'matched' | 'mismatch' | 'flagged'
export type MatchingResultStatus = 'pending' | 'verified' | 'rejected' | 'manual_review'
export type SubscriptionPlan = 'spark' | 'flame'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'
export type QuestionSource = 'deep_outlook' | 'subscription'
export type QuestionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ReadingJobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TransactionType = 'deep_outlook' | 'subscription' | 'renewal'
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type PaymentProvider = 'stripe' | 'razorpay'
export type AdminRole = 'super_admin' | 'moderator' | 'support'
export type QuestionCategory = 'love' | 'career' | 'family' | 'spiritual' | 'money' | 'general'

export interface User {
  id: string
  email: string
  password_hash: string
  name: string | null
  country: string | null
  preferred_language: string
  timezone: string | null
  email_verified: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface UserProfile {
  id: string
  user_id: string
  date_of_birth: string | null
  time_of_birth: string | null
  place_of_birth: string | null
  birth_timezone: string | null
  astropalm_profile_text: string | null
  consent_flags: {
    images: boolean
    data_usage: boolean
  }
  created_at: string
  updated_at: string
}

export interface PalmImage {
  id: string
  user_id: string
  palm_type: PalmType
  storage_path: string
  public_url: string | null
  file_name: string | null
  file_size: number | null
  width: number | null
  height: number | null
  matching_score: number | null
  matching_status: MatchingStatus
  uploaded_at: string
  processed_at: string | null
}

export interface PalmMatchingResult {
  id: string
  user_id: string
  right_palm_id: string | null
  left_palm_id: string | null
  matching_confidence: number | null
  feature_vector: Record<string, unknown> | null
  status: MatchingResultStatus
  matched_at: string
  reviewed_by: string | null
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: SubscriptionPlan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  next_billing_date: string | null
  stripe_subscription_id: string | null
  razorpay_subscription_id: string | null
  provider: PaymentProvider | null
  created_at: string
  updated_at: string
}

export interface DailyQuota {
  id: string
  user_id: string
  date: string
  plan_type: SubscriptionPlan
  max_questions: number
  remaining_questions: number
  reset_at: string | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  user_id: string
  subscription_id: string | null
  source: QuestionSource
  text_original: string
  text_internal_en: string | null
  language_detected: string | null
  category: QuestionCategory
  created_at: string
  status: QuestionStatus
}

export interface Answer {
  id: string
  question_id: string
  user_id: string
  text: string
  text_internal_en: string | null
  safety_flags: Record<string, unknown> | null
  reviewed: boolean
  flagged: boolean
  created_at: string
  llm_model_used: string | null
  tokens_used: number | null
}

export interface ReadingJob {
  id: string
  user_id: string
  status: ReadingJobStatus
  questions: string[]
  generated_content: string | null
  payment_transaction_id: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  currency: string
  provider: PaymentProvider | null
  provider_payment_id: string | null
  status: TransactionStatus
  metadata: Record<string, unknown> | null
  created_at: string
}
