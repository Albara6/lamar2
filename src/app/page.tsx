export default function HomePage() {
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
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white'
          }}>
            🍗 CRAZY CHICKEN
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
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            lineHeight: '1.1'
          }}>
            GET CRAZY WITH
            <div style={{ color: '#fbbf24' }}>FLAVOR!</div>
          </h1>
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
            <span>(555) 123-CRAZY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#fbbf24', fontSize: '1.25rem' }}>🕐</span>
            <span>Open Daily 11AM - 11PM</span>
          </div>
          <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            🚫 PICKUP ONLY - NO DELIVERY
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#374151',
            marginBottom: '3rem'
          }}>
            CHOOSE YOUR CRAZY
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Burgers */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              cursor: 'pointer'
            }}>
              <div style={{
                height: '12rem',
                background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '4rem' }}>🍔</div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                  CRAZY BURGERS
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Juicy, stacked high, and absolutely insane!
                </p>
              </div>
            </div>

            {/* Chicken */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              cursor: 'pointer'
            }}>
              <div style={{
                height: '12rem',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '4rem' }}>🍗</div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                  CRISPY CHICKEN
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Perfectly seasoned and crazily crispy!
                </p>
              </div>
            </div>

            {/* Phillys */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              cursor: 'pointer'
            }}>
              <div style={{
                height: '12rem',
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '4rem' }}>🥪</div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                  PHILLY CHEESESTEAKS
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Authentic flavors that drive you crazy!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#374151',
        color: 'white',
        padding: '2rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            🍗 CRAZY CHICKEN
          </div>
          <p style={{ color: '#9ca3af' }}>
            Where Every Bite is Insanely Delicious!
          </p>
          <div style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            © 2024 Crazy Chicken. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
} 