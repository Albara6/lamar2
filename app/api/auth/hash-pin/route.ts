import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pin = '1234'
    
    // Generate a fresh hash for 1234
    const newHash = await bcrypt.hash(pin, 10)
    
    // Test the new hash
    const testNew = await bcrypt.compare(pin, newHash)
    
    // Test against the hash you have in database
    const dbHash = '$2a$10$rB9l3YaJ7k8HxQR8GkCZYeOCXGdKL2HGcZJqZx4nQbRzGfNmPvLpS'
    const testDb = await bcrypt.compare(pin, dbHash)
    
    return NextResponse.json({
      pin: pin,
      new_hash: newHash,
      new_hash_works: testNew,
      database_hash: dbHash,
      database_hash_works: testDb,
      message: testDb 
        ? 'Database hash is correct for 1234' 
        : 'Database hash is NOT for 1234 - use the new_hash value to update your Supabase users table'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

