import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export async function POST(request: Request) {
  try {
    const { order, customer } = await request.json()

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
          <title>Order Confirmation - Crazy Chicken</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #374151; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #dc2626; font-size: 24px; margin: 0;">🍗 CRAZY CHICKEN</h1>
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
              <p style="margin: 4px 0; color: #6b7280;">Location: <span style="color: #111827; font-weight: 500;">123 Food Street, City, State 12345</span></p>
              ${order.paymentMethod === 'cash' ? `
                <p style="margin: 16px 0 0 0; color: #dc2626; font-weight: 500;">
                  Please have cash ready for payment upon pickup.
                </p>
              ` : ''}
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px;">
              <p style="margin: 4px 0;">Thank you for choosing Crazy Chicken!</p>
              <p style="margin: 4px 0;">Questions? Contact us at support@crazychicken.us</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'orders@crazychicken.us',
      to: customer.email,
      subject: `Crazy Chicken Order Confirmation #${order.id}`,
      html: emailHtml
    })

    if (error) {
      console.error('Failed to send email:', error)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 