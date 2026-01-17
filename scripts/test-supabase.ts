/**
 * Test script to verify Supabase connection
 * Run with: npx tsx scripts/test-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please check your .env.local file')
  process.exit(1)
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Check connection
    console.log('1. Testing connection...')
    const { data, error } = await supabase.from('users').select('count').limit(0)
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('❌ Tables not found! Please run the schema.sql file in Supabase SQL Editor')
      } else {
        console.error('❌ Connection error:', error.message)
      }
      return false
    }
    console.log('✅ Connection successful!\n')

    // Test 2: Check tables
    console.log('2. Checking database tables...')
    const tables = [
      'users',
      'user_profiles',
      'palm_images',
      'subscriptions',
      'daily_quotas',
      'questions',
      'answers',
      'reading_jobs',
      'transactions',
    ]

    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(0)
      if (tableError) {
        console.error(`❌ Table "${table}" not found or not accessible`)
        return false
      }
    }
    console.log('✅ All tables exist!\n')

    // Test 3: Check storage bucket
    console.log('3. Checking storage bucket...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Storage error:', bucketError.message)
      return false
    }

    const palmImagesBucket = buckets?.find(b => b.name === 'palm-images')
    if (!palmImagesBucket) {
      console.error('❌ Storage bucket "palm-images" not found!')
      console.error('   Please create it in Supabase Storage section')
      return false
    }
    console.log('✅ Storage bucket "palm-images" exists!\n')

    console.log('🎉 All tests passed! Supabase is configured correctly.')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1)
})
