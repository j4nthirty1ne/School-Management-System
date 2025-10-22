# Backend Testing Guide

## 🧪 How to Test Your Backend

Your School Management System backend is now set up and ready to test! Follow this guide to verify everything is working correctly.

---

## ✅ Prerequisites Checklist

Before testing, make sure you have completed:

- [ ] Supabase project created
- [ ] Environment variables set in `frontend/.env.local`
- [ ] Database schema deployed (run SQL from `backend/database/schema.sql`)
- [ ] At least one admin user created in Supabase Auth
- [ ] Student codes generated (optional, for student registration testing)

---

## 🚀 Start the Development Server

The development server should already be running at **http://localhost:3000**

If not, start it with:
```bash
cd frontend
npm run dev
```

---

## 🔍 Test Pages & APIs

### 1. **Homepage** (`/`)
- URL: http://localhost:3000
- Shows project overview and features
- Click "Test Backend APIs" button to go to test page

### 2. **Test Page** (`/test`)
- URL: http://localhost:3000/test
- Interactive testing interface for all backend APIs

---

## 📝 Available API Tests

### Test 1: Database Connection
**Endpoint:** `GET /api/test`

**What it tests:**
- Supabase connection
- Database accessibility
- Environment variables are correct

**Expected Result:**
```json
{
  "success": true,
  "message": "Backend is working! Database connected successfully.",
  "timestamp": "2025-10-21T...",
  "supabaseUrl": "https://jggpcbuluptjkedolfgc.supabase.co"
}
```

**If it fails:**
- Check `.env.local` file has correct Supabase URL and keys
- Verify database schema is deployed
- Check Supabase project is active

---

### Test 2: Student Code Validation
**Endpoint:** `POST /api/validate/student-code`

**What it tests:**
- Student code validation logic
- Database query functionality
- Code status checking

**How to test:**
1. First, generate student codes in Supabase (see SUPABASE_SETUP.md Step 5)
2. Enter a code like `STU-2025-00001`
3. Click "Validate"

**Expected Result (if code exists and is available):**
```json
{
  "success": true,
  "code": {
    "id": "...",
    "code": "STU-2025-00001",
    "status": "available",
    "expires_at": "..."
  }
}
```

**Expected Result (if code doesn't exist):**
```json
{
  "success": false,
  "error": "Invalid student code"
}
```

---

### Test 3: Login
**Endpoint:** `POST /api/auth/login`

**What it tests:**
- Authentication functionality
- Supabase Auth integration
- Session management

**How to test:**
1. Enter admin email (created in Supabase)
2. Enter admin password
3. Click "Login"

**Expected Result (successful):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@school.com",
    ...
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "profile": {
    "role": "admin",
    "first_name": "System",
    "last_name": "Admin",
    ...
  }
}
```

**Expected Result (failed):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### Test 4: Get Current User
**Endpoint:** `GET /api/auth/user`

**What it tests:**
- Session persistence
- User profile retrieval
- Authentication state

**How to test:**
1. Login first (Test 3)
2. Click "Get User"

**Expected Result (if logged in):**
```json
{
  "success": true,
  "user": { ... },
  "profile": {
    "role": "admin",
    ...
  }
}
```

**Expected Result (if not logged in):**
```json
{
  "success": false,
  "error": "No active session"
}
```

---

### Test 5: Logout
**Endpoint:** `POST /api/auth/logout`

**What it tests:**
- Session termination
- Cookie clearing

**How to test:**
1. Login first
2. Click "Logout"

**Expected Result:**
```json
{
  "success": true
}
```

---

## 🔧 Testing with Postman/Thunder Client

You can also test APIs using Postman or Thunder Client:

### 1. Test Connection
```
GET http://localhost:3000/api/test
```

### 2. Validate Student Code
```
POST http://localhost:3000/api/validate/student-code
Content-Type: application/json

{
  "code": "STU-2025-00001"
}
```

### 3. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "your_password"
}
```

### 4. Get User (requires auth)
```
GET http://localhost:3000/api/auth/user
Cookie: sb-access-token=...; sb-refresh-token=...
```

### 5. Logout
```
POST http://localhost:3000/api/auth/logout
Cookie: sb-access-token=...; sb-refresh-token=...
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
**Solution:**
- Verify Supabase URL and keys in `.env.local`
- Check if Supabase project is active
- Ensure database schema is deployed

### Issue 2: "Invalid student code"
**Solution:**
- Generate student codes first (see SUPABASE_SETUP.md Step 5)
- Use the exact format: `STU-2025-00001`
- Check code status in Supabase (should be 'available')

### Issue 3: "Invalid email or password"
**Solution:**
- Verify admin user exists in Supabase Auth
- Check email spelling and password
- Ensure user profile was created in `user_profiles` table

### Issue 4: "No active session"
**Solution:**
- Login first before testing authenticated endpoints
- Check browser cookies are enabled
- Verify middleware is working

### Issue 5: TypeScript errors
**Solution:**
- Make sure all dependencies are installed: `npm install`
- Check `@supabase/supabase-js` and `@supabase/ssr` are installed
- Restart dev server

---

## ✅ Success Criteria

Your backend is working correctly if:

1. ✅ Database connection test passes
2. ✅ Student code validation works (returns valid/invalid correctly)
3. ✅ Login succeeds with correct credentials
4. ✅ Get user returns logged-in user data
5. ✅ Logout clears session successfully

---

## 📊 Next Steps After Testing

Once all tests pass:

1. **Create Admin Dashboard UI**
   - Student management interface
   - Teacher management interface
   - Student code generation UI

2. **Build Authentication Pages**
   - Login page for all roles
   - Student registration page
   - Password reset flow

3. **Implement Student Features**
   - Student profile page
   - View attendance
   - View grades

4. **Implement Teacher Features**
   - Mark attendance
   - Enter grades
   - Create announcements

5. **Implement Parent Features**
   - View children's information
   - Check attendance
   - View grades

---

## 📞 Getting Help

If you encounter issues:

1. Check the console for error messages
2. Review `SUPABASE_SETUP.md` for database setup
3. Check `backend/AUTH.md` for authentication details
4. Verify environment variables are correct
5. Check Supabase dashboard for logs

---

## 🎯 Test Checklist

Use this checklist to track your testing progress:

- [ ] Homepage loads correctly
- [ ] Test page is accessible
- [ ] Database connection test passes
- [ ] Student code validation works
- [ ] Login with admin works
- [ ] Get current user works after login
- [ ] Logout works
- [ ] APIs return proper error messages
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

---

**Happy Testing! 🚀**

Once all tests pass, you're ready to start building the UI components!
