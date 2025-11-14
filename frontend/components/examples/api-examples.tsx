'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// Example 1: Fetch current user
export function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    setLoading(true)
    const response = await api.auth.getCurrentUser()
    
    const resp: any = response
    if (resp.success && resp.data) {
      setUser(resp.data.user)
    }
    
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <div>
            <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </CardContent>
    </Card>
  )
}

// Example 2: Validate student code
export function StudentCodeValidator() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    setLoading(true)
    const response = await api.student.validateCode(code)
    setResult(response)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validate Student Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter student code"
            className="w-full border rounded px-3 py-2"
          />
          <Button onClick={handleValidate} disabled={loading}>
            {loading ? 'Validating...' : 'Validate'}
          </Button>
          
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="font-semibold">
                {result.success ? '✅ Valid Code' : '❌ Invalid Code'}
              </p>
              {result.error && <p className="text-sm text-red-600">{result.error}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Example 3: Test backend connection
export function BackendTest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    const response = await api.test.testConnection()
    setResult(response)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backend Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
        
        {result && (
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Example 4: Login form with API
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const response = await api.auth.login(email, password)
    setResult(response)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border rounded px-3 py-2"
            required
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {result.success ? '✅ Login successful!' : `❌ ${result.error}`}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// Example 5: Fetch with custom hook
export function useStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStudents = async () => {
    setLoading(true)
    const response = await api.student.getAll()
    const resp: any = response
    
    if (resp.success && resp.data) {
      setStudents(resp.data.students || [])
    } else {
      setError(resp.error || 'Failed to fetch students')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return { students, loading, error, refetch: fetchStudents }
}

// Usage of custom hook:
export function StudentsList() {
  const { students, loading, error, refetch } = useStudents()

  if (loading) return <div>Loading students...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Students ({students.length})</CardTitle>
          <Button onClick={refetch}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {students.map((student: any) => (
            <li key={student.id} className="p-2 border rounded">
              {student.first_name} {student.last_name} - {student.student_code}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
