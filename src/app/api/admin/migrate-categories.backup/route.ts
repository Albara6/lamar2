import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Starting migration: Adding image_url column to categories table...')
    
    // First, let's check if the column already exists by trying to select it
    const { error: checkError } = await supabaseAdmin
      .from('categories')
      .select('image_url')
      .limit(1)
    
    if (!checkError) {
      console.log('image_url column already exists!')
      return NextResponse.json({ 
        success: true, 
        message: 'image_url column already exists in categories table' 
      })
    }
    
    console.log('Column does not exist, adding it now via exec_sql RPC...')

    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;'
    })

    if (alterError) {
      console.error('Failed to add column via exec_sql:', alterError)
      return NextResponse.json({
        success: false,
        error: 'Failed to add image_url column',
        details: alterError
      }, { status: 500 })
    }

    console.log('image_url column added successfully!')

    console.log('Migration completed successfully!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Categories table is ready for image uploads' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to run migration',
      details: error 
    }, { status: 500 })
  }
} 