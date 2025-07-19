import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface MenuItem {
  category: string
}

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('menu_items')
      .select('category')
      .order('category')

    if (error) {
      console.error('Failed to fetch categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get unique categories
    const uniqueCategories = Array.from(new Set((categories as MenuItem[]).map(item => item.category)))

    // Transform the categories into the expected format
    const formattedCategories = uniqueCategories.map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
      display_order: 0 // Default order
    }))

    return NextResponse.json({ categories: formattedCategories })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const categoryId = body.name.toLowerCase().replace(/[^a-z0-9]/g, '')

    // First check if the category already exists
    const { data: existingCategory } = await supabaseAdmin
      .from('menu_items')
      .select('category')
      .eq('category', categoryId)
      .limit(1)

    if (existingCategory && existingCategory.length > 0) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }

    // Create a dummy menu item to establish the category
    // We need this because categories are stored as an enum in menu_items
    const { error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        name: `${body.name} (Placeholder)`,
        description: 'Temporary item to create category',
        category: categoryId,
        base_price: 0,
        is_available: false
      })

    if (error) {
      console.error('Failed to create category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ 
      category: {
        id: categoryId,
        name: body.name,
        display_order: body.display_order || 0
      }
    })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// Update a category
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name: body.name,
        display_order: body.display_order
      })
      .eq('id', body.id)
      .select()
      .single()
    if (error || !category) {
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
    return NextResponse.json({ category })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// Delete a category
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', body.id)
    if (error) {
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
} 