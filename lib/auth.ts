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
    // Get all active users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('active', true)

    if (error || !users) {
      console.error('Error fetching users:', error)
      return null
    }

    // Check PIN against each user
    for (const user of users) {
      const isValid = await bcrypt.compare(pin, (user as any).pin_hash)
      if (isValid) {
        return {
          id: (user as any).id,
          name: (user as any).name,
          role: (user as any).role,
          active: (user as any).active,
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error verifying PIN:', error)
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

