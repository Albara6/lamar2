import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export interface User {
  id: string
  name: string
  role: 'cashier' | 'manager' | 'admin'
  active: boolean
}

export async function verifyPin(pin: string): Promise<User | null> {
  try {
    console.log('Client: Verifying PIN via API...')
    
    // Call server-side API to verify PIN (bypasses RLS)
    const response = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Client: PIN verification failed:', error)
      return null
    }

    const data = await response.json()
    console.log('Client: PIN verified successfully:', data.user.name)
    return data.user
  } catch (error) {
    console.error('Client: Error verifying PIN:', error)
    return null
  }
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export function hasPermission(userRole: string, requiredRole: 'cashier' | 'manager' | 'admin'): boolean {
  const roleHierarchy = {
    cashier: 1,
    manager: 2,
    admin: 3,
  }

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole]
}

