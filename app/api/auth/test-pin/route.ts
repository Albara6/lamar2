import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get users from database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Test PIN 1234 against each user
    const testPin = '1234'
    const correctHash = '$2a$10$rB9l3YaJ7k8HxQR8GkCZYeOCXGdKL2HGcZJqZx4nQbRzGfNmPvLpS'
    
    const results = []
    
    for (const user of users) {
      const userData = user as any
      const isValid = await bcrypt.compare(testPin, userData.pin_hash)
      const matchesCorrectHash = userData.pin_hash === correctHash
      
      results.push({
        name: userData.name,
        role: userData.role,
        pin_hash_preview: userData.pin_hash.substring(0, 30) + '...',
        pin_hash_length: userData.pin_hash.length,
        matches_correct_hash: matchesCorrectHash,
        pin_1234_valid: isValid
      })
    }
    
    return NextResponse.json({
      users_found: users.length,
      correct_hash_preview: correctHash.substring(0, 30) + '...',
      results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

