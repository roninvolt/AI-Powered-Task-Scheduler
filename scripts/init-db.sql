-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  energy_level INTEGER DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
  preferred_work_hours TEXT DEFAULT '{"start": "09:00", "end": "18:00"}', -- JSON format
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_duration INTEGER, -- in minutes
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  energy_required TEXT DEFAULT 'medium' CHECK (energy_required IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subtasks table (for AI-generated task breakdowns)
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_duration INTEGER, -- in minutes
  order_index INTEGER,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Energy log table (for tracking user energy throughout the day)
CREATE TABLE IF NOT EXISTS public.energy_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level >= 10),
  mood TEXT,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table (for insights and productivity metrics)
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_planned INTEGER DEFAULT 0,
  avg_energy_level DECIMAL(3, 2),
  total_time_worked INTEGER, -- in minutes
  focus_sessions_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON public.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_user_id ON public.energy_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_logged_at ON public.energy_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id_date ON public.analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tasks table
CREATE POLICY "Users can read own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for subtasks table
CREATE POLICY "Users can read subtasks of their tasks"
  ON public.subtasks FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subtasks for their tasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks of their tasks"
  ON public.subtasks FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks of their tasks"
  ON public.subtasks FOR DELETE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for energy_logs table
CREATE POLICY "Users can read own energy logs"
  ON public.energy_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create energy logs"
  ON public.energy_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own energy logs"
  ON public.energy_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for analytics table
CREATE POLICY "Users can read own analytics"
  ON public.analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create analytics records"
  ON public.analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON public.analytics FOR UPDATE
  USING (auth.uid() = user_id);
