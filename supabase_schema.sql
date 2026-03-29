-- User Profile Extension (Links to Auth.Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    target_visa TEXT,
    opt_in_matching BOOLEAN DEFAULT false,
    reminder_enabled BOOLEAN DEFAULT false,
    reminder_time TIME DEFAULT '09:00',
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
    'locked', 'in_progress', 'paused', 'completed'
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
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Existing deployments: add enum value + column (safe to run once)
-- ALTER TYPE milestone_status ADD VALUE IF NOT EXISTS 'paused';
-- ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

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

-- Decisions Table (stores weighted comparisons)
CREATE TABLE public.decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    criteria JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Daily Goals Table
CREATE TABLE public.daily_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    date DATE NOT NULL,
    category goal_category,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own decisions" ON public.decisions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily goals" ON public.daily_goals
    FOR ALL USING (auth.uid() = user_id);

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- Streaks Table
CREATE TABLE public.streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own streaks" ON public.streaks
    FOR ALL USING (auth.uid() = user_id);

-- Calendar Connections Table (stores OAuth tokens for Google Calendar)
CREATE TABLE public.calendar_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar connections" ON public.calendar_connections
    FOR ALL USING (auth.uid() = user_id);

-- Peer Connections Table
CREATE TABLE public.connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connections" ON public.connections
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create connection requests" ON public.connections
    FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connections they're part of" ON public.connections
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Peers can read opted-in profiles (needed for peer matching)
CREATE POLICY "Users can read opted-in profiles" ON public.profiles
    FOR SELECT USING (opt_in_matching = true OR auth.uid() = id);

-- Peers can read goals of opted-in users (needed for peer matching)
CREATE POLICY "Users can read goals of opted-in users" ON public.goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = public.goals.user_id AND (opt_in_matching = true OR id = auth.uid())
        )
    );

-- RPC function for matching peers by shared goal categories
CREATE OR REPLACE FUNCTION match_peers(current_user_id UUID)
RETURNS TABLE(
    peer_id UUID,
    peer_name TEXT,
    peer_bio TEXT,
    peer_visa TEXT,
    shared_goals TEXT[]
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        p.id AS peer_id,
        p.name AS peer_name,
        p.bio AS peer_bio,
        p.target_visa AS peer_visa,
        ARRAY_AGG(DISTINCT mg.title) AS shared_goals
    FROM public.profiles p
    JOIN public.goals pg ON pg.user_id = p.id
    JOIN public.goals mg ON mg.user_id = current_user_id
        AND (mg.category = pg.category OR LOWER(mg.title) = LOWER(pg.title))
    WHERE p.id != current_user_id
        AND p.opt_in_matching = true
    GROUP BY p.id, p.name, p.bio, p.target_visa
    ORDER BY ARRAY_LENGTH(ARRAY_AGG(DISTINCT mg.title), 1) DESC NULLS LAST;
$$;
