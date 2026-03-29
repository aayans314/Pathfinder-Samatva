"use client";

import { useAppStore } from "@/lib/store";
import { 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Award, 
  Code2, 
  ExternalLink,
  Target,
  Sparkles,
  User as UserIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const profile = useAppStore((s) => s.profile);
  const goals = useAppStore((s) => s.goals);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  const { resume_data } = profile;
  const hasResume = resume_data && Object.keys(resume_data).length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── HEADER SECTION ─────────────────────────── */}
      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
        <div className="h-32 md:h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          <div className="absolute -bottom-16 left-8 p-1 rounded-3xl bg-background shadow-2xl">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-4 border-background">
               <UserIcon className="h-16 w-16 text-muted-foreground/40" />
            </div>
          </div>
        </div>
        
        <CardContent className="pt-20 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{profile.name}</h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl">
              {resume_data?.summary?.split('.')[0] || profile.bio || "Pathfinder Member"}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              {profile.target_visa && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span>{profile.target_visa} Visa Track</span>
                </div>
              )}
              {resume_data?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <span>{resume_data.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>Global</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400">
               Update Resume
             </Button>
             <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
               Share Profile
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT COLUMN: About & Activity ────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 px-1">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              About
            </h3>
            <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border/50">
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio || resume_data?.summary || "No bio information provided yet. Upload a resume to share your story."}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Experience Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 px-1">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              Experience
            </h3>
            <div className="space-y-4">
              {resume_data?.experience && resume_data.experience.length > 0 ? (
                resume_data.experience.map((exp, i) => (
                  <Card key={i} className="border-none bg-card/40 hover:bg-card/60 transition-colors shadow-sm ring-1 ring-border/50 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg">{exp.title}</h4>
                          <p className="text-indigo-500 font-medium">{exp.company}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{exp.duration}</p>
                        </div>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/50 mt-1.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptySection message="No experience data found in your last resume upload." />
              )}
            </div>
          </section>

          {/* Projects Section */}
          {resume_data?.projects && resume_data.projects.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 px-1">
                <Code2 className="h-5 w-5 text-indigo-500" />
                Featured Projects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resume_data.projects.map((proj, i) => (
                  <Card key={i} className="border-none bg-card/40 hover:bg-indigo-500/5 transition-all shadow-sm ring-1 ring-border/50 group">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold group-hover:text-indigo-400 transition-colors">{proj.name}</h4>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {proj.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT COLUMN: Skills & Education ──────────────── */}
        <div className="space-y-8">
          
          {/* Active Goals Mini-Widget */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
              <Target className="h-5 w-5 text-indigo-500" />
              Active Paths
            </h3>
            <Card className="border-none bg-indigo-500/5 ring-1 ring-indigo-500/20 shadow-sm">
              <CardContent className="p-4 space-y-3">
                {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-sm font-medium truncate">{goal.title}</span>
                  </div>
                ))}
                {goals.length === 0 && <p className="text-xs text-muted-foreground italic">No active paths yet.</p>}
              </CardContent>
            </Card>
          </section>

          {/* Education Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              Education
            </h3>
            <div className="space-y-4">
              {resume_data?.education?.map((edu, i) => (
                <Card key={i} className="border-none bg-card/40 shadow-sm ring-1 ring-border/50 overflow-hidden">
                  <CardContent className="p-4 space-y-1">
                    <h4 className="font-bold text-sm leading-tight">{edu.institution}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{edu.degree}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Class of {edu.year}</p>
                  </CardContent>
                </Card>
              ))}
              {!resume_data?.education?.length && <EmptySection message="No education listed." compact />}
            </div>
          </section>

          {/* Skills Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
              <Award className="h-5 w-5 text-indigo-500" />
              Skills
            </h3>
            <Card className="border-none bg-card/40 shadow-sm ring-1 ring-border/50">
              <CardContent className="p-5 flex flex-wrap gap-2">
                {resume_data?.skills ? (
                  resume_data.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="bg-muted hover:bg-muted/80 text-foreground transition-colors px-3 py-1 rounded-lg">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center w-full">No skills extracted.</p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Certifications Section */}
          {resume_data?.certifications && resume_data.certifications.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold px-1">Certifications</h3>
              <div className="space-y-2">
                {resume_data.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 ring-1 ring-border/50 text-sm">
                    <Award className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="truncate">{cert}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

function EmptySection({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/60 bg-muted/5",
      compact ? "py-4 px-2" : "py-12 px-6"
    )}>
      <p className="text-sm text-muted-foreground italic">
        {message}
      </p>
    </div>
  );
}
