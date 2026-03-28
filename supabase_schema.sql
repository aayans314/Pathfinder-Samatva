-- User Profile Extension (Links to Auth.Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    target_visa TEXT,
    opt_in_matching BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Goal Categories Enum
CREATE TYPE goal_category AS ENUM (
    'daily', 'academics', 'research', 'internships', 
    'career', 'fitness', 'networking', 'personal'
);

-- Goal Status Enum
CREATE TYPE goal_status AS ENUM (
    'active', 'paused', 'completed', 'archived'
);

-- Goals Table
CREATE TABLE public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category goal_category NOT NULL,
    target_date TIMESTAMP WITH TIME ZONE,
    status goal_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Milestone Status Enum
CREATE TYPE milestone_status AS ENUM (
    'locked', 'in_progress', 'completed'
);

-- Milestones Table (The Nodes in our Tree)
CREATE TABLE public.milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    parent_milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    status milestone_status DEFAULT 'locked',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks Table (Sub-items for each Milestone)
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies so users can only read/edit their own data
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own goals" ON public.goals 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage milestones linking to their goals" ON public.milestones 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.goals WHERE id = public.milestones.goal_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage tasks linking to their milestones" ON public.tasks 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.milestones m 
            JOIN public.goals g ON m.goal_id = g.id 
            WHERE m.id = public.tasks.milestone_id AND g.user_id = auth.uid()
        )
    );
