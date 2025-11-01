import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { pin: pinRaw } = await request.json()
    const pin = typeof pinRaw === 'string' ? pinRaw.trim() : String(pinRaw ?? '').trim()

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      )
    }

    console.log('Server: Verifying PIN...')

    // Use supabaseAdmin to bypass RLS
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('active', true)

    if (error) {
      console.error('Server: Error fetching users:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('Server: No users found in database')
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    console.log(`Server: Found ${users.length} active users`)

    // Check PIN against each user
    for (const user of users) {
      const userData = user as any
      console.log(`Server: Checking PIN for user: ${userData.name} (${userData.role})`)
      const storedHash = (userData.pin_hash ?? '').trim()
      
      console.log(`Server: PIN entered: "${pin}" (length: ${pin.length})`)
      console.log(`Server: Stored hash: "${storedHash.substring(0, 30)}..." (length: ${storedHash.length})`)
      console.log(`Server: Hash format check: ${/^\$2[aby]\$/.test(storedHash) ? 'bcrypt' : 'other'}`)

      let isValid = false
      // If stored value looks like a bcrypt hash, use bcrypt
      if (/^\$2[aby]\$/.test(storedHash)) {
        isValid = await bcrypt.compare(pin, storedHash)
        console.log(`Server: bcrypt.compare result: ${isValid}`)
      } else if (/^\d{6}$/.test(storedHash)) {
        // Fallback: support plaintext 4-digit pins if mistakenly stored unhashed
        isValid = pin === storedHash
        console.log(`Server: Plaintext comparison result: ${isValid}`)
      } else {
        // Unsupported format; skip
        isValid = false
        console.log(`Server: Unsupported hash format`)
      }
      
      if (isValid) {
        console.log(`Server: PIN valid for ${userData.name}`)
        return NextResponse.json({
          user: {
            id: userData.id,
            name: userData.name,
            role: userData.role,
            active: userData.active,
          }
        })
      }
    }

    console.log('Server: PIN did not match any user')
    return NextResponse.json(
      { error: 'Invalid PIN' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Server: Error verifying PIN:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

