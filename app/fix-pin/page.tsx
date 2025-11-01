'use client'

import { useState } from 'react'

export default function FixPinPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFix = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/auth/fix-pin', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to fix PIN')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Fix PIN Issue</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-800">
            <strong>What this does:</strong> This will update all active users in your database 
            to use a fresh, correct hash for PIN <strong>1234</strong>.
          </p>
        </div>

        <button
          onClick={handleFix}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg text-xl font-bold text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Fixing...' : 'Fix PIN Now'}
        </button>

        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-800 font-bold text-lg mb-2">✅ Success!</p>
            <p className="text-green-700 mb-4">{result.message}</p>
            
            <div className="bg-white rounded p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Users updated:</strong> {result.users_updated}
              </p>
              {result.users && result.users.length > 0 && (
                <div className="mb-2">
                  <strong className="text-sm text-gray-600">Updated users:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {result.users.map((u: any, i: number) => (
                      <li key={i} className="text-sm text-gray-700">
                        {u.name} ({u.role})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-gray-600">
                <strong>Hash test passed:</strong> {result.test_passed ? '✅ Yes' : '❌ No'}
              </p>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-800 font-medium mb-2">Next steps:</p>
              <ol className="list-decimal list-inside text-blue-700 space-y-1">
                <li>Go to the admin login page</li>
                <li>Enter PIN: <strong>1234</strong></li>
                <li>You should now be able to log in!</li>
              </ol>
              <a 
                href="/admin/login" 
                className="mt-3 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Admin Login →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

