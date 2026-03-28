# Pathfinder 🧭

Pathfinder is a gamified life and career management dashboard designed for international students and ambitious professionals. It visualizes your long-term goals as dynamic, interactive "skill trees" to fight burnout and ensure steady progress.

## ✨ Key Features
- **Gamified "My Path" Visualization**: Track your goals (Career, Academics, Fitness) using beautifully rendered nodular skill trees built with React Flow.
- **Radial "All Paths" Hub**: A stunning circular layout that fans all your life categories around a central, leveling-up User Avatar.
- **AI-Driven Onboarding**: Uses the **DeepSeek API** to parse your bio and automatically generate actionable, multi-step sub-goals for your dashboard.
- **Supabase Authentication**: Integrated with Google and LinkedIn OAuth.
- **Decision Matrix Analyzer**: Compare tough life choices using weighted criteria scoring.
- **Peer Matching**: Find users on a similar path or visa journey.

## 🚀 Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **State Management**: Zustand (Global Store)
- **Visualization**: `xyflow/react` (React Flow)
- **Backend & Auth**: Supabase (@supabase/ssr)
- **AI Integration**: DeepSeek (OpenAI SDK)

## 🛠️ Getting Started
1. Clone the repository setting up your local environment:
```bash
npm install
```
2. Set up your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```
3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
