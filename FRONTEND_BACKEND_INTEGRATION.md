# Frontend-Backend Integration Guide

Complete guide for fetching data from the backend in the frontend.

---

## 📦 Files Created

1. **`/lib/api.ts`** - API utility functions
2. **`/lib/auth-context.tsx`** - Authentication context (optional)
3. **`/components/examples/api-examples.tsx`** - Working examples
4. **`/app/admin/students/page.tsx`** - Full example page

---

## 🚀 Quick Start

### 1. Import the API utility

```tsx
import api from '@/lib/api'
```

### 2. Make API calls

```tsx
// Test connection
const response = await api.test.testConnection()

// Login
const response = await api.auth.login(email, password)

// Get current user
const response = await api.auth.getCurrentUser()

// Validate student code
const response = await api.student.validateCode('STU-2025-00001')
```

---

## 📚 API Reference

### Authentication API

```tsx
import { authApi } from '@/lib/api'

// Login
const result = await authApi.login('user@school.com', 'password')
// Returns: { success: boolean, data?: { user, session }, error?: string }

// Register
const result = await authApi.register({
  email: 'new@student.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
})

// Get current user
const result = await authApi.getCurrentUser()
// Returns: { success: boolean, data?: { user }, error?: string }

// Logout
const result = await authApi.logout()
```

### Student API

```tsx
import { studentApi } from '@/lib/api'

// Validate student code
const result = await studentApi.validateCode('STU-2025-00001')
// Returns: { success: boolean, valid: boolean, code?: object }

// Get all students
const result = await studentApi.getAll()
// Returns: { success: boolean, data?: { students: [] } }

// Get student by ID
const result = await studentApi.getById('uuid-here')

// Get student by code
const result = await studentApi.getByCode('STU-2025-00001')

// Update student
const result = await studentApi.update('uuid', { 
  first_name: 'Updated Name' 
})

// Delete student
const result = await studentApi.delete('uuid')
```

### Admin API

```tsx
import { adminApi } from '@/lib/api'

// Generate student codes
const result = await adminApi.generateCodes(50, 90)
// Params: count, expiryDays
// Returns: { success: boolean, codes: string[], count: number }

// Get all codes
const result = await adminApi.getCodes()
```

---

## 💡 Usage Examples

### Example 1: Fetch Data with useState

```tsx
'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function MyComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const response = await api.student.getAll()
    
    if (response.success) {
      setData(response.data)
    } else {
      setError(response.error || 'Failed to fetch')
    }
    
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <div>{/* Display data */}</div>
}
```

### Example 2: Form Submission

```tsx
'use client'

import { useState } from 'react'
import api from '@/lib/api'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const response = await api.auth.login(email, password)
    
    if (response.success) {
      // Redirect or update UI
      window.location.href = '/dashboard'
    } else {
      alert(response.error)
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  )
}
```

### Example 3: Custom Hook

```tsx
'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

// Create reusable hook
function useStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStudents = async () => {
    setLoading(true)
    const response = await api.student.getAll()
    
    if (response.success) {
      setStudents(response.data?.students || [])
    } else {
      setError(response.error || 'Failed')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return { students, loading, error, refetch: fetchStudents }
}

// Use the hook
export default function StudentsList() {
  const { students, loading, error, refetch } = useStudents()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {students.map(student => (
        <div key={student.id}>
          {student.first_name} {student.last_name}
        </div>
      ))}
    </div>
  )
}
```

### Example 4: With Error Handling

```tsx
'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function StudentCodeValidator() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await api.student.validateCode(code)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        error: 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter student code"
      />
      <button onClick={handleValidate} disabled={loading}>
        {loading ? 'Validating...' : 'Validate'}
      </button>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          <AlertDescription>
            {result.success ? '✅ Valid code!' : `❌ ${result.error}`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

### Example 5: Fetch on Button Click

```tsx
'use client'

import { useState } from 'react'
import api from '@/lib/api'

export default function TestConnection() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    const response = await api.test.testConnection()
    setResult(response)
    setLoading(false)
  }

  return (
    <div>
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Testing...' : 'Test Backend'}
      </button>

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}
```

---

## 🔄 Real-Time Data Fetching

### Polling (Auto-refresh)

```tsx
useEffect(() => {
  // Fetch immediately
  fetchData()

  // Then fetch every 30 seconds
  const interval = setInterval(fetchData, 30000)

  // Cleanup
  return () => clearInterval(interval)
}, [])
```

### Manual Refresh

```tsx
const [refreshKey, setRefreshKey] = useState(0)

useEffect(() => {
  fetchData()
}, [refreshKey])

// Trigger refresh
<button onClick={() => setRefreshKey(prev => prev + 1)}>
  Refresh
</button>
```

---

## 🎯 Best Practices

### 1. Always Handle Loading States

```tsx
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
if (!data) return <NoDataMessage />
```

### 2. Use Try-Catch for Error Handling

```tsx
try {
  const response = await api.student.getAll()
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error)
}
```

### 3. Show User Feedback

```tsx
const [message, setMessage] = useState('')

const handleAction = async () => {
  const response = await api.student.update(id, data)
  
  if (response.success) {
    setMessage('✅ Update successful!')
  } else {
    setMessage(`❌ ${response.error}`)
  }
}
```

### 4. Cleanup on Unmount

```tsx
useEffect(() => {
  let cancelled = false

  const fetchData = async () => {
    const response = await api.student.getAll()
    if (!cancelled) {
      setData(response.data)
    }
  }

  fetchData()

  return () => {
    cancelled = true
  }
}, [])
```

---

## 📋 Full Working Example

See **`/app/admin/students/page.tsx`** for a complete example with:
- ✅ Data fetching
- ✅ Loading states
- ✅ Error handling
- ✅ Table display
- ✅ Stats cards
- ✅ Refresh functionality

---

## 🧪 Testing

Visit these pages to test:

1. **`/test`** - Test all API endpoints
2. **`/admin/students`** - View students list
3. **`/login`** - Test authentication

---

## 🔐 Authentication Flow

```tsx
// 1. User logs in
const loginResponse = await api.auth.login(email, password)

// 2. Session is stored in cookies automatically

// 3. Subsequent requests include auth automatically
const userResponse = await api.auth.getCurrentUser()

// 4. Logout
await api.auth.logout()
```

---

## 🚨 Error Codes

```typescript
response.success === false

Possible errors:
- "Invalid credentials" - Wrong email/password
- "Not authenticated" - Need to login first
- "Permission denied" - Insufficient permissions
- "Code already used" - Student code invalid
- "relation does not exist" - Database not setup
```

---

**Your frontend is now fully integrated with the backend!** 🎉

Test it at: http://localhost:3001/admin/students
