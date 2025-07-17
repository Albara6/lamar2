'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ArrowLeft } from 'lucide-react'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams.get('order_id')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    } else if (sessionId && orderId) {
      handlePaymentSuccess()
    } else {
      setError('Missing order information')
      setLoading(false)
    }
  }, [orderId, sessionId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details')
      }
      setOrderDetails(data.order)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    try {
      // Verify the payment and update order status
      const response = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          orderId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payment')
      }

      setOrderDetails(data.order)
    } catch (err: any) {
      console.error('Payment verification error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '4px solid #dc2626',
            borderTop: '4px solid transparent',
            margin: '0 auto 2rem',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
            Verifying your payment...
          </h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <span style={{ fontSize: '2rem', color: 'white' }}>❌</span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
            Payment Verification Failed
          </h2>
          
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            {error}
          </p>

          <button
            onClick={() => window.location.href = '/menu'}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
          >
            <ArrowLeft size={16} />
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            🍗 CRAZY CHICKEN
          </h1>
          <p style={{ opacity: 0.9, margin: '0.5rem 0 0 0' }}>
            Payment Successful
          </p>
        </div>

        {/* Success Content */}
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <Check size={60} color="white" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
            Payment Successful!
          </h2>
          
          <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '1.125rem' }}>
            Order #{orderDetails?.id?.slice(-8) || orderId?.slice(-8)}
          </p>
          
          <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: 1.6 }}>
            Thank you for your payment! Your order has been confirmed and is being prepared. 
            We've sent a confirmation email with all the details.
          </p>

          {orderDetails && (
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '2rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Customer:</span>
                <span style={{ fontWeight: 'bold' }}>{orderDetails.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Total Amount:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>${orderDetails.total_amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Payment Status:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>✓ Paid</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Estimated Pickup:</span>
                <span style={{ fontWeight: 'bold' }}>15-20 minutes</span>
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: '#dc2626', marginTop: 0, marginBottom: '1rem' }}>What's Next?</h3>
            <ul style={{ color: '#6b7280', margin: 0, paddingLeft: '1.5rem', lineHeight: 1.6, textAlign: 'left' }}>
              <li>Your order is being prepared by our kitchen team</li>
              <li>You'll receive updates via email</li>
              <li>Pick up your order at our location within 15-20 minutes</li>
              <li>Your payment has been processed successfully</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/menu'}
            style={{
              width: '100%',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  )
} 