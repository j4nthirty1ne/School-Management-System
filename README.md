# School Management System

A comprehensive school management system built with Next.js, Supabase, and TypeScript.

## 🚀 Features

- **Multi-Role Authentication** (Admin, Teacher, Student, Parent)
- **Student Management** with registration code system
- **Teacher Management** with unique teacher codes
- **Attendance Tracking** with real-time updates
- **Grade Management** and report cards
- **Class & Subject Management**
- **Announcements & Assignments**
- **Parent Portal** for monitoring student progress

## 🛠️ Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Authentication:** Supabase Auth with Row Level Security
- **Deployment:** Vercel (Frontend) + Supabase (Backend)

## 📁 Project Structure

```
school_management_system/
├── frontend/              # Next.js application
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and backend services
│   │   ├── supabase/    # Supabase client configs
│   │   └── backend/     # Backend services
│   └── middleware.ts    # Auth middleware
├── backend/              # Backend documentation & schemas
│   ├── database/        # SQL schemas
│   ├── config/          # Configuration files
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
├── .env                 # Environment variables (root)
├── PROJECT_OVERVIEW.md  # Complete project documentation
└── SUPABASE_SETUP.md   # Supabase setup guide
```

## 🔧 Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account

### 2. Clone & Install

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Your `.env.local` file is already configured with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jggpcbuluptjkedolfgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**⚠️ Important:** You still need to add your `SUPABASE_SERVICE_ROLE_KEY` from Supabase dashboard.

### 4. Set Up Database

Follow the instructions in `SUPABASE_SETUP.md` to:
1. Create database schema
2. Enable Row Level Security
3. Create first admin user
4. Generate student codes

### 5. Run Development Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Complete project documentation
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup guide
- **[backend/AUTH.md](./backend/AUTH.md)** - Authentication flow documentation
- **[backend/README.md](./backend/README.md)** - Backend services documentation

## 🔐 Authentication Flow

### Admin
- Login only (no public registration)
- Create other admins, teachers, and manage students

### Teacher
- Created by admin with unique teacher code
- Login with email or teacher code

### Student
- Public registration with validation code
- Anti-spam measures with code verification
- Parent account auto-created during registration

### Parent
- Auto-created when student registers
- Login with email and password (sent via email)
- Can view multiple children if linked

## 🗄️ Database Schema

### Core Tables
- `user_profiles` - User information
- `students` - Student records
- `teachers` - Teacher records
- `parents` - Parent records
- `classes` - Class information
- `subjects` - Subject catalog
- `attendance` - Attendance records
- `grades` - Student grades
- `student_codes` - Registration codes
- `announcements` - School announcements
- `assignments` - Homework/assignments

## 🎯 Key Features to Implement

### Phase 1 (Current Semester)
- [ ] Authentication pages (Login/Register)
- [ ] Admin Dashboard
- [ ] Student Management (CRUD)
- [ ] Teacher Management (CRUD)
- [ ] Attendance System
- [ ] Grade Management
- [ ] Student/Parent Portal

### Phase 2 (Future)
- [ ] Real-time notifications
- [ ] File upload (documents, photos)
- [ ] Report card generation (PDF)
- [ ] Email notifications
- [ ] Mobile responsive design
- [ ] Dark mode

### Phase 3 (Advanced)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] AI-powered insights
- [ ] Online payment integration
- [ ] Video conferencing

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

### Database (Supabase)
Already hosted on Supabase cloud.

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔒 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Environment variables protected
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ Rate limiting
- ✅ HTTPS only in production

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is for educational purposes (WCT Course, Year 3).

## 👥 Team

- [Add your team members here]

## 📞 Support

For issues and questions:
- Check documentation first
- Review `SUPABASE_SETUP.md` for database issues
- Check `backend/AUTH.md` for auth issues

---

**Project Status:** In Development  
**Last Updated:** October 21, 2025  
**Version:** 1.0.0
