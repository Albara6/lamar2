"use client"

import { useAuth } from '@/lib/AuthProvider'
import React, { useEffect, useState } from 'react'

export default function AuthGate ({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [guest, setGuest] = useState<boolean>(false)

  useEffect(() => {
    setGuest(localStorage.getItem('guest') === 'true')
  }, [])

  if (loading) return null // could add spinner
  if (user || guest) return <>{children}</>

  return <AuthModal onGuest={() => { localStorage.setItem('guest', 'true'); setGuest(true) }} />
}

function AuthModal ({ onGuest }: { onGuest: () => void }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup' | 'verify-phone'>(() => 'login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    try {
      setLoading(true)
      setError('')
      if (mode === 'login') {
        await signIn(form.email, form.password)
      } else if (mode === 'signup') {
        await signUp(form)
        // After successful signup, switch to phone verification
        setPendingPhone(form.phone)
        setMode('verify-phone')
        setMessage('Account created! Please verify your phone number.')
      }
    } catch (e: any) {
      // Check if it's an email confirmation error
      if (e.message?.includes('Email not confirmed') || e.message?.includes('email_not_confirmed')) {
        setError('Email not confirmed. ')
        setMessage('Click "Fix Email Confirmation" below to resolve this.')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const fixEmailConfirmation = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/auth/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setMessage(data.message)
      // Try login again after confirming email
      setTimeout(async () => {
        try {
          await signIn(form.email, form.password)
        } catch (e: any) {
          setError(e.message)
        }
      }, 1000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyPhone = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, token: verificationCode })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setMessage('Phone verified! You can now skip verification at checkout.')
      // Close modal after successful verification
      setTimeout(() => {
        window.location.reload() // Refresh to update auth state
      }, 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const resendOTP = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setMessage('New verification code sent!')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const skipVerification = () => {
    // Allow user to skip phone verification for now
    window.location.reload()
  }

  const disabled = loading || (mode === 'signup' && (!form.name || !form.phone)) || (!form.email && mode !== 'verify-phone') || (!form.password && mode !== 'verify-phone') || (mode === 'verify-phone' && !verificationCode)

  if (mode === 'verify-phone') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Verify Phone Number</h2>
          <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
            Enter the verification code sent to {pendingPhone}
          </p>
          <input 
            placeholder='Enter 6-digit code' 
            value={verificationCode} 
            onChange={e => setVerificationCode(e.target.value)}
            maxLength={6}
            style={inputStyle} 
          />
          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
          {message && <p style={{ color: 'green', fontSize: '0.875rem' }}>{message}</p>}
          <button disabled={disabled} onClick={verifyPhone} style={{ ...btnStyle, opacity: disabled ? 0.6 : 1 }}>
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ cursor: 'pointer', color: '#2563eb' }} onClick={resendOTP}>
              Didn't receive code? Resend
            </span>
          </div>
          <hr style={{ margin: '1rem 0' }} />
          <button onClick={skipVerification} style={{ ...btnStyle, background: '#6b7280' }}>
            Skip for Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>{mode === 'login' ? 'Log In' : 'Create Account'}</h2>
        {mode === 'signup' && (
          <input placeholder='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        )}
        <input placeholder='Email' type='email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
        {mode === 'signup' && (
          <input placeholder='Phone' value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
        )}
        <input placeholder='Password' type='password' value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
        {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
        {message && <p style={{ color: 'green', fontSize: '0.875rem' }}>{message}</p>}
        <button disabled={disabled} onClick={submit} style={{ ...btnStyle, opacity: disabled ? 0.6 : 1 }}>{loading ? 'Please wait…' : (mode === 'login' ? 'Log In' : 'Sign Up')}</button>
        {error.includes('Email not confirmed') && mode === 'login' && (
          <button onClick={fixEmailConfirmation} style={{ ...btnStyle, background: '#f59e0b', marginTop: '0.5rem' }}>
            Fix Email Confirmation
          </button>
        )}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          {mode === 'login' ? (
            <span style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Need an account? Sign up.</span>
          ) : (
            <span style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => { setMode('login'); setError(''); setMessage('') }}>Already have an account? Log in.</span>
          )}
        </div>
        <hr style={{ margin: '1rem 0' }} />
        <button onClick={onGuest} style={{ ...btnStyle, background: '#6b7280' }}>Continue as Guest</button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  marginBottom: '0.75rem'
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  background: '#dc2626',
  color: 'white',
  padding: '0.75rem',
  borderRadius: '0.375rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer'
} 