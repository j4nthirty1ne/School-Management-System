-- Migration: Update assignments table for new form fields
-- This migration updates the assignments table to support the new assignment/quiz form

-- First, drop the old assignments table if it exists
DROP TABLE IF EXISTS public.assignments CASCADE;

-- Create the updated assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'assignment', -- assignment, quiz, homework, project
  due_date DATE,
  max_score INTEGER DEFAULT 100,
  instructions TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, archived, draft
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_type ON assignments(type);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_created_by ON assignments(created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON assignments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments

-- Teachers can create and manage all assignments (simplified - assumes any teacher can create assignments)
CREATE POLICY "Teachers can manage assignments"
ON assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.user_id = auth.uid()
  )
);

-- Students can view assignments for their classes
CREATE POLICY "Students can view class assignments"
ON assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.user_id = auth.uid()
    AND s.class_id = assignments.class_id
  )
);

-- Parents can view assignments for their children's classes
CREATE POLICY "Parents can view children assignments"
ON assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    JOIN students s ON s.id = psl.student_id
    WHERE p.user_id = auth.uid()
    AND s.class_id = assignments.class_id
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create assignment submissions table (for students to submit work)
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES teachers(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, graded, late, missing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Indexes for assignment_submissions
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);

-- Trigger for assignment_submissions updated_at
CREATE TRIGGER update_assignment_submissions_updated_at 
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for assignment_submissions
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_submissions

-- Students can manage their own submissions
CREATE POLICY "Students can manage own submissions"
ON assignment_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = assignment_submissions.student_id
    AND s.user_id = auth.uid()
  )
);

-- Teachers can view and grade all submissions (simplified)
CREATE POLICY "Teachers can manage submissions"
ON assignment_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.user_id = auth.uid()
  )
);

-- Parents can view their children's submissions
CREATE POLICY "Parents can view children submissions"
ON assignment_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    WHERE psl.student_id = assignment_submissions.student_id
    AND p.user_id = auth.uid()
  )
);

-- Admins can manage all submissions
CREATE POLICY "Admins can manage all submissions"
ON assignment_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

COMMENT ON TABLE assignments IS 'Stores assignments, quizzes, homework, and projects created by teachers';
COMMENT ON TABLE assignment_submissions IS 'Stores student submissions for assignments';
