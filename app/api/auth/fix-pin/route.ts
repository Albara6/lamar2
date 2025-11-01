import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const pin = '1234'
    
    // Generate a fresh hash for 1234
    const correctHash = await bcrypt.hash(pin, 10)
    
    console.log('Generated new hash for PIN 1234:', correctHash)
    
    // Update all active users to use this hash
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ pin_hash: correctHash })
      .eq('active', true)
      .select()
    
    if (error) {
      console.error('Error updating users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Test the new hash
    const testResult = await bcrypt.compare(pin, correctHash)
    
    return NextResponse.json({
      success: true,
      message: 'All active users updated with correct PIN hash for 1234',
      users_updated: data?.length || 0,
      new_hash: correctHash,
      test_passed: testResult,
      users: data?.map((u: any) => ({ name: u.name, role: u.role }))
    })
  } catch (error: any) {
    console.error('Error in fix-pin:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

