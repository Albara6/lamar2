'use client'

import React, { useState, useEffect } from 'react'

interface BusinessSettings {
  id: string
  name: string
  phone: string
  email: string
  address: string
  hours: any
  is_accepting_orders: boolean
  banner_enabled: boolean
  banner_text: string
}

export default function HomePage(): React.ReactElement {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    fetchBusinessSettings()
  }, [])

  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch('/api/admin/business-settings')
      const data = await response.json()
      setBusinessSettings(data.businessSettings)
    } catch (error) {
      console.error('Failed to fetch business settings:', error)
    }
  }

  const formatHours = (hours: any) => {
    if (!hours || !hours.monday) return 'Hours vary - please call'
    
    // For simplicity, show Monday hours as general hours
    // You could enhance this to show different hours per day
    const mondayHours = hours.monday
    if (mondayHours.closed) return 'Closed today'
    
    return `Open Daily ${mondayHours.open} - ${mondayHours.close}`
  }

  // Default values while loading
  const displayName = businessSettings?.name || 'CRAZY CHICKEN'
  const displayPhone = businessSettings?.phone || '(555) 123-CRAZY'
  const displayHours = businessSettings?.hours ? formatHours(businessSettings.hours) : 'Open Daily 11AM - 11PM'
  const displayAddress = businessSettings?.address || '123 Food Street, City, State 12345'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)'
    }}>
      {/* Navigation */}
      <nav style={{
        backgroundColor: '#dc2626',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src="/business_logo.PNG" 
              alt={displayName}
              style={{
                height: '2.5rem',
                width: 'auto'
              }}
            />
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              🍗 {displayName}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{
              position: 'relative',
              padding: '0.5rem',
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🛒</span>
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#fbbf24',
                color: '#dc2626',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                0
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
        color: 'white',
        padding: '5rem 1rem',
        textAlign: 'center',
        flex: 1
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <img 
              src="/business_logo.PNG" 
              alt={displayName}
              style={{
                height: '8rem',
                width: 'auto',
                marginBottom: '1rem'
              }}
            />
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              lineHeight: '1.1'
            }}>
              GET CRAZY WITH
              <div style={{ color: '#fbbf24' }}>FLAVOR!</div>
            </h1>
          </div>
          <p style={{
            fontSize: '1.5rem',
            marginBottom: '2rem',
            maxWidth: '48rem',
            margin: '0 auto 2rem'
          }}>
            Experience the wildest burgers, crispiest chicken, and most delicious phillys in town!
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <a href="/menu" style={{
              backgroundColor: '#fbbf24',
              color: '#dc2626',
              fontWeight: 'bold',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1.25rem',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              ORDER NOW
            </a>
            <a href="/menu" style={{
              border: '2px solid white',
              color: 'white',
              fontWeight: 'bold',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1.25rem',
              textDecoration: 'none'
            }}>
              VIEW MENU
            </a>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section style={{
        backgroundColor: '#374151',
        color: 'white',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '3rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#fbbf24', fontSize: '1.25rem' }}>📞</span>
            <span>{displayPhone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#fbbf24', fontSize: '1.25rem' }}>🕐</span>
            <span>{displayHours}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#fbbf24', fontSize: '1.25rem' }}>📍</span>
            <span>{displayAddress}</span>
          </div>
          <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            🚫 PICKUP ONLY - NO DELIVERY
          </div>
        </div>
      </section>
    </div>
  )
}