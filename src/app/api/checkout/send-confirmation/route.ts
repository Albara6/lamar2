import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { orderId, customerEmail, customerName, items, total, paymentMethod } = await request.json()

    if (!orderId || !customerEmail) {
      return NextResponse.json(
        { error: 'Order ID and customer email are required' },
        { status: 400 }
      )
    }

    // Create email content
    const itemsList = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 1rem; vertical-align: top;">
          <div style="font-weight: bold; color: #374151;">${item.quantity}x ${item.menuItem.name}</div>
          ${item.selectedSize ? `<div style="font-size: 0.875rem; color: #6b7280;">Size: ${item.selectedSize.name}</div>` : ''}
          ${item.selectedModifiers && item.selectedModifiers.length > 0 
            ? `<div style="font-size: 0.875rem; color: #6b7280;">Modifiers: ${item.selectedModifiers.map((m: any) => m.name).join(', ')}</div>` 
            : ''
          }
          ${item.specialInstructions ? `<div style="font-size: 0.875rem; color: #6b7280; font-style: italic;">Note: ${item.specialInstructions}</div>` : ''}
        </td>
        <td style="padding: 1rem; text-align: right; font-weight: bold; color: #374151;">
          $${item.totalPrice.toFixed(2)}
        </td>
      </tr>
    `).join('')

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Crazy Chicken</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626, #f97316); padding: 2rem; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 2rem; font-weight: bold;">
                    🍗 CRAZY CHICKEN
                </h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 0.5rem 0 0 0; font-size: 1.125rem;">
                    Order Confirmation
                </p>
            </div>

            <!-- Order Details -->
            <div style="padding: 2rem;">
                <div style="background-color: #10b981; color: white; padding: 1rem; border-radius: 0.5rem; text-align: center; margin-bottom: 2rem;">
                    <h2 style="margin: 0; font-size: 1.25rem;">✅ Order Confirmed!</h2>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #374151; margin-bottom: 1rem;">Hello ${customerName}!</h3>
                    <p style="color: #6b7280; line-height: 1.6;">
                        Thank you for your order! We're excited to prepare your delicious meal. 
                        Your order has been received and is being prepared with care.
                    </p>
                </div>

                <!-- Order Info -->
                <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #6b7280;">Order Number:</span>
                        <span style="font-weight: bold; color: #374151;">#${orderId.slice(-8)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #6b7280;">Payment Method:</span>
                        <span style="font-weight: bold; color: #374151;">
                            ${paymentMethod === 'cash' ? '💵 Cash (Pay on pickup)' : '💳 Card (Paid online)'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Estimated Pickup Time:</span>
                        <span style="font-weight: bold; color: #374151;">15-20 minutes</span>
                    </div>
                </div>

                <!-- Order Items -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #374151; margin-bottom: 1rem;">Your Order</h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;">
                        ${itemsList}
                        <tr style="background-color: #f9fafb;">
                            <td style="padding: 1rem; font-weight: bold; color: #374151;">Total</td>
                            <td style="padding: 1rem; text-align: right; font-weight: bold; color: #374151; font-size: 1.125rem;">
                                $${total.toFixed(2)}
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- What's Next -->
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 1rem;">What's Next?</h3>
                    <ul style="color: #6b7280; margin: 0; padding-left: 1.5rem; line-height: 1.6;">
                        <li>Your order is being prepared by our kitchen team</li>
                        <li>You'll receive an update when your order is ready for pickup</li>
                        <li>Pick up your order at our location within 15-20 minutes</li>
                        ${paymentMethod === 'cash' ? '<li><strong>Please have your payment ready ($' + total.toFixed(2) + ') when you arrive</strong></li>' : ''}
                    </ul>
                </div>

                <!-- Contact Info -->
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h3 style="color: #374151; margin-bottom: 1rem;">Restaurant Information</h3>
                    <div style="color: #6b7280; line-height: 1.8;">
                        <div>📍 123 Food Street, City, State 12345</div>
                        <div>📞 (555) 123-CRAZY</div>
                        <div>📧 info@crazychicken.com</div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
                        Thank you for choosing Crazy Chicken! We appreciate your business.
                    </p>
                    <p style="color: #6b7280; font-size: 0.875rem; margin: 0.5rem 0 0 0;">
                        🔥 Where Every Bite is Insanely Delicious! 🔥
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `

    // In a real application, you would use a service like SendGrid, Mailgun, or AWS SES
    // For now, we'll simulate sending the email
    console.log('=== EMAIL CONFIRMATION ===')
    console.log('To:', customerEmail)
    console.log('Subject: Order Confirmation - Crazy Chicken')
    console.log('Order ID:', orderId)
    console.log('Total:', total)
    console.log('Payment Method:', paymentMethod)
    console.log('========================')

    // Here you would integrate with your email service
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: customerEmail,
      from: 'orders@crazychicken.com',
      subject: 'Order Confirmation - Crazy Chicken',
      html: emailHtml,
    }

    await sgMail.send(msg)
    */

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully'
    })

  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
} 