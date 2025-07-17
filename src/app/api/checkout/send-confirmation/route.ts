import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: Request) {
  try {
    const { order, customer } = await request.json()

    // Format order items for email
    const orderItems = order.items.map((item: any) => `
      ${item.quantity}x ${item.menuItem.name}
      ${item.selectedSize ? `Size: ${item.selectedSize.name}` : ''}
      ${item.selectedModifiers.length > 0 ? `Add-ons: ${item.selectedModifiers.map((mod: any) => mod.name).join(', ')}` : ''}
      ${item.specialInstructions ? `Special Instructions: ${item.specialInstructions}` : ''}
      Price: $${item.totalPrice.toFixed(2)}
    `).join('\n')

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0;">🍗 CRAZY CHICKEN</h1>
          <p style="margin: 0.5rem 0 0 0;">Order Confirmation</p>
        </div>
        
        <div style="padding: 2rem;">
          <h2>Thank you for your order!</h2>
          
          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order #:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
          </div>

          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0;">Order Items</h3>
            <pre style="white-space: pre-wrap;">${orderItems}</pre>
          </div>

          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 1.5rem; border-radius: 0.5rem;">
            <h3 style="color: #dc2626; margin-top: 0;">Pickup Information</h3>
            <ul style="padding-left: 1.5rem; margin: 0;">
              <li>Your order will be ready in 15-20 minutes</li>
              <li>Please pick up your order at our location</li>
              <li>Show your order number at pickup</li>
              <li>Questions? Call us at (870) 494-1363</li>
            </ul>
          </div>
        </div>
      </div>
    `

    // Send confirmation email
    const { data, error } = await resend.emails.send({
      from: 'Crazy Chicken <onboarding@resend.dev>',
      to: customer.email,
      subject: `Order Confirmation #${order.id}`,
      html: emailHtml
    })

    if (error) {
      console.error('Email sending error:', error)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Confirmation email sent successfully' 
    })

  } catch (error: any) {
    console.error('Send confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 