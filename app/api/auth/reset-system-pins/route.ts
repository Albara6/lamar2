import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function generateSixDigit(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    // Pick one admin and one non-admin active user
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 })
    }

    const adminUser = (users as any[]).find(u => u.role === 'admin')
    const staffUser = (users as any[]).find(u => u.role !== 'admin')

    if (!adminUser || !staffUser) {
      return NextResponse.json({ error: 'Need at least 1 admin and 1 staff user' }, { status: 400 })
    }

    const adminPinClear = generateSixDigit()
    const staffPinClear = generateSixDigit()

    const [adminHash, staffHash] = await Promise.all([
      bcrypt.hash(adminPinClear, 10),
      bcrypt.hash(staffPinClear, 10)
    ])

    // Update
    const updates = [] as Promise<any>[]
    updates.push(
      supabaseAdmin.from('users').update({ pin_hash: adminHash }).eq('id', (adminUser as any).id)
    )
    updates.push(
      supabaseAdmin.from('users').update({ pin_hash: staffHash }).eq('id', (staffUser as any).id)
    )

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      admin: { id: (adminUser as any).id, name: (adminUser as any).name, pin: adminPinClear },
      staff: { id: (staffUser as any).id, name: (staffUser as any).name, pin: staffPinClear }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
