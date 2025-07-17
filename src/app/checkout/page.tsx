'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { CheckoutData, CustomerInfo } from '@/types'
import { Phone, User, Mail, CreditCard, DollarSign, Check, ArrowLeft, Loader2 } from 'lucide-react'

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
  const [currentStep, setCurrentStep] = useState<'phone' | 'customer' | 'payment' | 'confirmation'>('phone')
  
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
  
  const [orderId, setOrderId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Set hydrated state after component mounts
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Redirect if cart is empty (but only after hydration)
  useEffect(() => {
    if (isHydrated && cart.items.length === 0) {
      window.location.href = '/menu'
    }
  }, [cart.items, isHydrated])

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
    
    try {
      const orderData = {
        customer: {
          phone: phoneStep.phoneNumber.replace(/\D/g, ''),
          name: customerStep.name.trim(),
          email: customerStep.email.trim(),
          isVerified: phoneStep.isVerified
        },
        paymentMethod: paymentStep.method,
        items: cart.items,
        total: cart.total
      }

      if (paymentStep.method === 'stripe') {
        // Process Stripe payment
        const response = await fetch('/api/checkout/stripe-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Payment failed')
        }

        // Redirect to Stripe checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
          return
        }
      } else {
        // Process cash payment (create order directly)
        const response = await fetch('/api/checkout/cash-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Order creation failed')
        }

        setOrderId(data.orderId)
        cart.clearCart()
        // Redirect to success page with orderId
        window.location.href = `/checkout/success?order_id=${data.orderId}`
        return
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) {
    return null // Will redirect via useEffect
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

              {/* Order Summary */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Order Summary</h3>
                {cart.items.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <span>
                      {item.quantity}x {item.menuItem.name}
                      {item.selectedSize && ` (${item.selectedSize.name})`}
                    </span>
                    <span>${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '0.5rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>Total:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Options */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  border: `2px solid ${paymentStep.method === 'stripe' ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  backgroundColor: paymentStep.method === 'stripe' ? '#fef2f2' : 'white'
                }}
                onClick={() => setPaymentStep(prev => ({ ...prev, method: 'stripe' }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CreditCard size={20} color={paymentStep.method === 'stripe' ? '#dc2626' : '#6b7280'} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#374151' }}>Pay with Card</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Secure payment via Stripe</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  border: `2px solid ${paymentStep.method === 'cash' ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: paymentStep.method === 'cash' ? '#fef2f2' : 'white'
                }}
                onClick={() => setPaymentStep(prev => ({ ...prev, method: 'cash' }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <DollarSign size={20} color={paymentStep.method === 'cash' ? '#dc2626' : '#6b7280'} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#374151' }}>Pay with Cash</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pay when you pick up your order</div>
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
                {loading 
                  ? 'Processing...' 
                  : paymentStep.method === 'stripe' 
                    ? `Pay $${cart.total.toFixed(2)}` 
                    : 'Place Order'
                }
              </button>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem'
              }}>
                <Check size={40} color="white" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                Order Confirmed!
              </h2>
              
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Order #{orderId.slice(-8)}
              </p>
              
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                We've sent a confirmation email to {customerStep.email}.
                {paymentStep.method === 'cash' && ' Please have your payment ready when you pick up your order.'}
              </p>

              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>What's Next?</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  • Your order is being prepared
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  • You'll receive updates via email
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  • Pick up time: 15-20 minutes
                </p>
              </div>

              <button
                onClick={() => window.location.href = '/menu'}
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
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 