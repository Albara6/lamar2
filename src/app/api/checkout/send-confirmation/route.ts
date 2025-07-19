import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

// Initialize Resend with fallback for missing API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export async function POST(request: Request) {
  try {
    // Check if Resend is configured
    if (!resend) {
      console.warn('RESEND_API_KEY not configured, skipping email confirmation')
      return NextResponse.json({ 
        success: false, 
        message: 'Email service not configured' 
      }, { status: 200 }) // Don't fail the order if email fails
    }

    const body = await request.json()
    const { order, customer } = body

    if (!order || !customer || !customer.email) {
      console.error('Invalid request data:', body)
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required data' 
      }, { status: 400 })
    }

    // Fetch business settings for dynamic information
    let businessSettings = null
    try {
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('business_settings')
        .select('*')
        .single()
      
      if (!settingsError) {
        businessSettings = settings
      }
    } catch (error) {
      console.error('Failed to fetch business settings for email:', error)
    }

    // Use business settings or defaults
    const businessName = businessSettings?.name || 'CRAZY CHICKEN'
    const businessAddress = businessSettings?.address || '123 Food Street, City, State 12345'
    const businessEmail = businessSettings?.email || 'support@crazychicken.us'
    const businessPhone = businessSettings?.phone || '(555) 123-CRAZY'

    const itemsList = order.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600;">${item.menuItem.name}</div>
          ${item.selectedSize ? `<div style="color: #6b7280; font-size: 14px;">Size: ${item.selectedSize.name}</div>` : ''}
          ${item.selectedModifiers.length > 0 ? `
            <div style="color: #6b7280; font-size: 14px;">
              Add-ons: ${item.selectedModifiers.map((mod: any) => mod.name).join(', ')}
            </div>
          ` : ''}
          ${item.specialInstructions ? `
            <div style="color: #6b7280; font-size: 14px; font-style: italic;">
              Note: ${item.specialInstructions}
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${formatCurrency(item.totalPrice)}
        </td>
      </tr>
    `).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - ${businessName}</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #374151; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://crazy-chicken-restaurant.vercel.app'}/business_logo.PNG" 
                     alt="${businessName}" 
                     style="height: 48px; width: auto;" />
                <h1 style="color: #dc2626; font-size: 24px; margin: 0;">🍗 ${businessName}</h1>
              </div>
              <p style="color: #6b7280; margin-top: 8px;">Order Confirmation</p>
            </div>

            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111827;">Order Details</h2>
              <p style="margin: 4px 0; color: #6b7280;">Order #: <span style="color: #111827; font-weight: 500;">${order.id}</span></p>
              <p style="margin: 4px 0; color: #6b7280;">Date: <span style="color: #111827; font-weight: 500;">${new Date().toLocaleDateString()}</span></p>
              <p style="margin: 4px 0; color: #6b7280;">Payment Method: <span style="color: #111827; font-weight: 500;">${order.paymentMethod === 'cash' ? 'Cash on Pickup' : 'Card'}</span></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: 600; color: #dc2626;">
                    ${formatCurrency(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111827;">Pickup Information</h2>
              <p style="margin: 4px 0; color: #6b7280;">Estimated Time: <span style="color: #111827; font-weight: 500;">15-20 minutes</span></p>
              <p style="margin: 4px 0; color: #6b7280;">Location: <span style="color: #111827; font-weight: 500;">${businessAddress}</span></p>
              <p style="margin: 4px 0; color: #6b7280;">Phone: <span style="color: #111827; font-weight: 500;">${businessPhone}</span></p>
              ${order.paymentMethod === 'cash' ? `
                <p style="margin: 16px 0 0 0; color: #dc2626; font-weight: 500;">
                  Please have cash ready for payment upon pickup.
                </p>
              ` : ''}
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px;">
              <p style="margin: 4px 0;">Thank you for choosing ${businessName}!</p>
              <p style="margin: 4px 0;">Questions? Contact us at ${businessEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: `orders@${businessEmail.split('@')[1] || 'crazychicken.us'}`,
        to: customer.email,
        subject: `${businessName} Order Confirmation #${order.id}`,
        html: emailHtml
      })

      if (error) {
        console.error('Failed to send email:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to send confirmation email',
          details: error 
        }, { status: 200 }) // Don't fail the order if email fails
      }

      return NextResponse.json({ success: true })
    } catch (emailError) {
      console.error('Email service error:', emailError)
      return NextResponse.json({ 
        success: false, 
        error: 'Email service error',
        details: emailError 
      }, { status: 200 }) // Don't fail the order if email fails
    }
  } catch (error) {
    console.error('Send confirmation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 200 }) // Don't fail the order if email fails
  }
} 