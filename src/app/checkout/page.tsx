'use client'

import React, { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCartStore } from '@/store/cartStore'
import { CheckoutData, CustomerInfo } from '@/types'
import { Phone, User, Mail, CreditCard, DollarSign, Check, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/AuthProvider'

// --- Constants ---
const TAX_RATE = 0.0975 // 9.75%

interface PhoneVerificationStep {
  phoneNumber: string
  verificationCode: string
  isCodeSent: boolean
  isVerifying: boolean
  isVerified: boolean
}

interface CustomerStep {
  name: string
  email: string
  isAutoFilled: boolean
}

interface PaymentStep {
  method: 'stripe' | 'cash'
  isProcessing: boolean
}

export default function CheckoutPage() {
  const cart = useCartStore()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<'phone' | 'customer' | 'payment' | 'confirmation'>(
    user ? 'payment' : 'phone' // Skip phone step for logged-in users
  )
  
  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<PhoneVerificationStep>({
    phoneNumber: '',
    verificationCode: '',
    isCodeSent: false,
    isVerifying: false,
    isVerified: false
  })
  
  // Customer info state
  const [customerStep, setCustomerStep] = useState<CustomerStep>({
    name: '',
    email: '',
    isAutoFilled: false
  })
  
  // Payment state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>({
    method: 'stripe',
    isProcessing: false
  })

  // Stripe embedded payment states
  const [stripePromise] = useState(() => {
    if (typeof window === 'undefined') return null
    // dynamic import to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { loadStripe } = require('@stripe/stripe-js')
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  })
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  
  const [orderId, setOrderId] = useState<string>('')

  // Derived pricing (re-evaluated on every render)
  const subtotal = cart.total
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2))
  const totalWithTax = parseFloat((subtotal + tax).toFixed(2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Set hydrated state after component mounts and load customer profile
  useEffect(() => {
    setIsHydrated(true)
    
    // If user is logged in, fetch their profile and auto-fill
    if (user && !customerStep.isAutoFilled) {
      fetch('/api/customer/profile')
        .then(res => res.json())
        .then(data => {
          if (data.customer) {
            setCustomerStep({
              name: data.customer.name || '',
              email: data.customer.email || '',
              isAutoFilled: true
            })
            setPhoneStep(prev => ({
              ...prev,
              phoneNumber: data.customer.phone || '',
              isVerified: data.customer.phone_verified || false // Use actual verification status
            }))
          }
        })
        .catch(err => console.error('Failed to load profile:', err))
    }
  }, [user, customerStep.isAutoFilled])

  // Redirect to the menu if the cart is empty *when first arriving* on this page.
  // After the user has progressed past the phone-verification step we no longer
  // perform this automatic redirect so that clearing the cart as part of the
  // order-placement flow (cash or Stripe) doesn't bounce the user back to the
  // menu before we can send them to the success/Stripe page.
  useEffect(() => {
    if (
      isHydrated &&
      cart.items.length === 0 &&
      currentStep === 'phone' // only auto-redirect on initial visit
    ) {
      window.location.href = '/menu'
    }
  }, [cart.items, isHydrated, currentStep])

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 10)
    
    if (limited.length >= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    } else if (limited.length >= 3) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return limited
    }
  }

  const sendVerificationCode = async () => {
    if (phoneStep.phoneNumber.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/checkout/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: phoneStep.phoneNumber.replace(/\D/g, '') 
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setPhoneStep(prev => ({ ...prev, isCodeSent: true }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (phoneStep.verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/checkout/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: phoneStep.phoneNumber.replace(/\D/g, ''),
          verificationCode: phoneStep.verificationCode
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      // Auto-fill customer info if returning customer
      if (data.customer) {
        setCustomerStep({
          name: data.customer.name || '',
          email: data.customer.email || '',
          isAutoFilled: true
        })
      }

      setPhoneStep(prev => ({ ...prev, isVerified: true }))
      setCurrentStep('customer')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const proceedToPayment = () => {
    if (!customerStep.name.trim() || !customerStep.email.trim()) {
      setError('Please enter your name and email')
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(customerStep.email)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setCurrentStep('payment')
  }

  const processPayment = async () => {
    setLoading(true)
    setError('')
    
    console.log('Starting payment process for method:', paymentStep.method)
    console.log('Cart items:', cart.items)
    console.log('Cart total:', cart.total)
    
    try {
      const orderData = {
        customer: {
          phone: phoneStep.phoneNumber.replace(/\D/g, ''),
          name: customerStep.name.trim(),
          email: customerStep.email.trim(),
          isVerified: phoneStep.isVerified,
          customer_id: user?.id // Include customer_id if logged in
        },
        paymentMethod: paymentStep.method,
        items: cart.items,
        total: totalWithTax
      }

      // DEBUG: Log outgoing order data
      console.log('DEBUG: Order data being sent to backend:', JSON.stringify(orderData, null, 2));

      if (paymentStep.method === 'stripe') {
        // NEW: create payment intent and embed form
        console.log('Creating payment intent...')

        const response = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Payment initiation failed')
        }

        setClientSecret(data.clientSecret)
        setOrderId(data.orderId)

        // Do NOT clear cart yet; wait until payment succeeds
        return // show embedded form
      } else {
        console.log('Processing cash payment...')
        
        // Process cash payment (create order directly)
        const response = await fetch('/api/checkout/cash-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        const data = await response.json()
        console.log('Cash payment response:', data)
        
        if (!response.ok) {
          console.error('Cash payment failed:', data)
          throw new Error(data.error || 'Order creation failed')
        }

        if (!data.success || !data.orderId) {
          console.error('Cash payment response missing required fields:', data)
          throw new Error('Invalid response from server')
        }

        // Store order ID and clear cart
        console.log('Cash payment successful, order ID:', data.orderId)
        cart.clearCart()

        // Redirect to success page
        window.location.href = `/checkout/success?order_id=${data.orderId}`
        return
      }
    } catch (err: any) {
      console.error('Payment processing error:', err)
      setError(err.message || 'An unexpected error occurred')
      
      // If there was an error, don't clear the cart
      console.log('Payment failed, keeping cart items')
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) {
    return null // Will redirect via useEffect
  }

  // --- Stripe Payment Element confirmation handler ---
  const EmbeddedPaymentForm = () => {
    const stripe = useStripe()
    const elements = useElements()

    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async () => {
      if (!stripe || !elements) return
      setSubmitting(true)
      setMessage('')

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${orderId}`
        },
        redirect: 'if_required'
      })

      if (error) {
        setMessage(error.message || 'Payment failed')
        setSubmitting(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Mark order paid and navigate to success page
        await fetch('/api/checkout/verify-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId
          })
        })

        cart.clearCart()
        window.location.href = `/checkout/success?order_id=${orderId}`
      }
    }

    return (
      <div>
        <PaymentElement />
        {message && <p style={{ color: '#dc2626', marginTop: '1rem' }}>{message}</p>}
        <button
          onClick={handleSubmit}
          disabled={!stripe || submitting}
          style={{
            width: '100%',
            backgroundColor: submitting ? '#9ca3af' : '#dc2626',
            color: 'white',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem'
          }}
        >
          {submitting ? 'Processing...' : 'Pay Now'}
        </button>
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
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={() => window.location.href = '/menu'}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              🍗 Checkout
            </h1>
            <p style={{ opacity: 0.9, margin: 0, marginTop: '0.25rem' }}>
              {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} • ${cart.total.toFixed(2)}
            </p>
            <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
              {cart.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ 
                    width: '50px',
                    height: '50px',
                    backgroundColor: item.menuItem.category === 'burgers' ? '#f87171' :
                                   item.menuItem.category === 'chicken' ? '#fbbf24' : '#34d399',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {item.menuItem.category === 'burgers' ? '🍔' :
                     item.menuItem.category === 'chicken' ? '🍗' : '🥪'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'white' }}>{item.menuItem.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {item.quantity}x • ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f9fafb',
          padding: '1rem 2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {[
            { key: 'phone', label: 'Verify Phone', icon: Phone },
            { key: 'customer', label: 'Your Info', icon: User },
            { key: 'payment', label: 'Payment', icon: CreditCard },
            { key: 'confirmation', label: 'Complete', icon: Check }
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative'
            }}>
              {index > 0 && (
                <div style={{
                  position: 'absolute',
                  left: '-50%',
                  top: '12px',
                  width: '100%',
                  height: '2px',
                  backgroundColor: currentStep === key || 
                    (key === 'customer' && (currentStep === 'payment' || currentStep === 'confirmation')) ||
                    (key === 'payment' && currentStep === 'confirmation') ? '#dc2626' : '#e5e7eb'
                }} />
              )}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: currentStep === key || 
                  (key === 'phone' && (currentStep === 'customer' || currentStep === 'payment' || currentStep === 'confirmation')) ||
                  (key === 'customer' && (currentStep === 'payment' || currentStep === 'confirmation')) ||
                  (key === 'payment' && currentStep === 'confirmation') ? '#dc2626' : '#e5e7eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}>
                <Icon size={12} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: currentStep === key ? '#dc2626' : '#6b7280',
                fontWeight: currentStep === key ? 'bold' : 'normal',
                textAlign: 'center'
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* Phone Verification Step */}
          {currentStep === 'phone' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                Verify Your Phone Number
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                We'll send you a verification code to confirm your order and save your preferences for next time.
              </p>

              

              {!phoneStep.isCodeSent ? (
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneStep.phoneNumber}
                    onChange={(e) => setPhoneStep(prev => ({ 
                      ...prev, 
                      phoneNumber: formatPhoneNumber(e.target.value) 
                    }))}
                    placeholder="(555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      marginBottom: '0.75rem'
                    }}
                  />
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '1.5rem',
                    lineHeight: '1.25',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    By providing your phone number, you agree to receive order updates via SMS. Message & data rates may apply. Your information will be processed in accordance with our Privacy Policy and the AP2 10DC regulations for food service establishments. You can opt-out at any time by replying STOP to any message. Standard carrier fees may apply.
                  </div>
                  <button
                    onClick={sendVerificationCode}
                    disabled={loading}
                    style={{
                      width: '100%',
                      backgroundColor: loading ? '#9ca3af' : '#dc2626',
                      color: 'white',
                      padding: '0.875rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Verification Code
                  </label>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Enter the 6-digit code sent to {phoneStep.phoneNumber}
                  </p>
                  <input
                    type="text"
                    value={phoneStep.verificationCode}
                    onChange={(e) => setPhoneStep(prev => ({ 
                      ...prev, 
                      verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                    }))}
                    placeholder="123456"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      letterSpacing: '0.5rem',
                      marginBottom: '1rem'
                    }}
                  />
                  <button
                    onClick={verifyCode}
                    disabled={loading}
                    style={{
                      width: '100%',
                      backgroundColor: loading ? '#9ca3af' : '#dc2626',
                      color: 'white',
                      padding: '0.875rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button
                    onClick={() => setPhoneStep(prev => ({ 
                      ...prev, 
                      isCodeSent: false, 
                      verificationCode: '' 
                    }))}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      padding: '0.75rem',
                      border: '2px solid #dc2626',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Use Different Number
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Customer Info Step */}
          {currentStep === 'customer' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                Your Information
              </h2>
              {customerStep.isAutoFilled && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  color: '#0369a1',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Check size={16} />
                  Welcome back! We've pre-filled your information.
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerStep.name}
                  onChange={(e) => setCustomerStep(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerStep.email}
                  onChange={(e) => setCustomerStep(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button
                onClick={proceedToPayment}
                style={{
                  width: '100%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                Payment Method
              </h2>

              {clientSecret && stripePromise ? (
                <div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                    Enter Payment Details
                  </h3>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <EmbeddedPaymentForm />
                  </Elements>
                </div>
              ) : (
              <>
              {/* Order Summary */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🛒</span>
                  Order Summary ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                  {cart.items.map((item, index) => (
                    <div key={index} style={{ 
                      backgroundColor: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      <div style={{ 
                        width: '60px',
                        height: '60px',
                        backgroundColor: item.menuItem.category === 'burgers' ? '#f87171' :
                                       item.menuItem.category === 'chicken' ? '#fbbf24' : '#34d399',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}>
                        {item.menuItem.category === 'burgers' ? '🍔' :
                         item.menuItem.category === 'chicken' ? '🍗' : '🥪'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                          {item.menuItem.name}
                        </div>
                        {item.selectedSize && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Size: {item.selectedSize.name}
                            {item.selectedSize.price_modifier > 0 && ` (+$${item.selectedSize.price_modifier.toFixed(2)})`}
                          </div>
                        )}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Add-ons: {item.selectedModifiers.map(mod => `${mod.name}${mod.price > 0 ? ` (+$${mod.price.toFixed(2)})` : ''}`).join(', ')}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                            Note: {item.specialInstructions}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Quantity: {item.quantity}
                          </span>
                          <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                            ${item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  borderTop: '2px solid #e5e7eb',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#111827' }}>Subtotal:</span>
                      <span style={{ fontWeight: 'bold' }}>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#6b7280' }}>Tax (11.375%):</span>
                      <span style={{ fontWeight: 'bold' }}>${tax.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151' }}>Total:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', marginLeft: '0.5rem' }}>${totalWithTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                  Choose Payment Method
                </h3>
                <div style={{
                  border: `2px solid ${paymentStep.method === 'stripe' ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  backgroundColor: paymentStep.method === 'stripe' ? '#fef2f2' : 'white',
                  transition: 'all 0.2s'
                }}
                onClick={() => setPaymentStep(prev => ({ ...prev, method: 'stripe' }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CreditCard size={24} color={paymentStep.method === 'stripe' ? '#dc2626' : '#6b7280'} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#374151' }}>Pay with Card</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Secure payment via Stripe • Process instantly</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  border: `2px solid ${paymentStep.method === 'cash' ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: paymentStep.method === 'cash' ? '#fef2f2' : 'white',
                  transition: 'all 0.2s'
                }}
                onClick={() => setPaymentStep(prev => ({ ...prev, method: 'cash' }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <DollarSign size={24} color={paymentStep.method === 'cash' ? '#dc2626' : '#6b7280'} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#374151' }}>Pay with Cash</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pay when you pick up your order • Have exact change ready</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={processPayment}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {paymentStep.method === 'stripe' ? (loading ? 'Loading...' : 'Pay Online') : (loading ? 'Placing Order...' : 'Place Order')}
              </button>
              </>
              )}
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                animation: 'pulse 2s infinite'
              }}>
                <Check size={50} color="white" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                Order Created Successfully!
              </h2>
              
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '1.125rem' }}>
                Order #{orderId.slice(-8)}
              </p>
              
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🍗</span>
                  <span style={{ fontWeight: 'bold', color: '#0369a1' }}>Crazy Chicken</span>
                </div>
                <p style={{ color: '#0369a1', fontSize: '0.875rem', margin: 0 }}>
                  Your order is being prepared! You'll be redirected to the confirmation page in a moment.
                </p>
              </div>
              
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#dc2626', margin: '0 0 1rem 0', fontWeight: 'bold' }}>
                  {paymentStep.method === 'cash' ? '💵 Cash Payment' : '💳 Card Payment'}
                </h3>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                  {paymentStep.method === 'cash' 
                    ? `Please have your cash ready when you pick up your order. Total: $${totalWithTax.toFixed(2)}`
                    : `Your payment has been processed securely. Total: $${totalWithTax.toFixed(2)}`
                  }
                </p>
              </div>

              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>What's Next?</h3>
                <div style={{ textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Order confirmed and sent to kitchen
                  </p>
                  <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Confirmation email sent to {customerStep.email}
                  </p>
                  <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#dc2626' }}>⏱</span> Estimated pickup time: 15-20 minutes
                  </p>
                  <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#dc2626' }}>📍</span> Pickup location: 123 Food Street
                  </p>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <p>Redirecting to confirmation page...</p>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginTop: '1rem'
                }}>
                  <div style={{
                    width: '0%',
                    height: '100%',
                    backgroundColor: '#dc2626',
                    borderRadius: '2px',
                    animation: 'progress 1.5s ease-in-out forwards'
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
} 