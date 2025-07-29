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
  const [mode, setMode] = useState<'login' | 'signup'>(() => 'login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    try {
      setLoading(true)
      if (mode === 'login') {
        await signIn(form.email, form.password)
      } else {
        await signUp(form)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || (mode === 'signup' && (!form.name || !form.phone)) || !form.email || !form.password

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
        <button disabled={disabled} onClick={submit} style={{ ...btnStyle, opacity: disabled ? 0.6 : 1 }}>{loading ? 'Please wait…' : (mode === 'login' ? 'Log In' : 'Sign Up')}</button>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          {mode === 'login' ? (
            <span style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => { setMode('signup'); setError('') }}>Need an account? Sign up.</span>
          ) : (
            <span style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => { setMode('login'); setError('') }}>Already have an account? Log in.</span>
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