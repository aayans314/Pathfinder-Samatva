"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, Compass, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingLinkedin, setIsLoadingLinkedin] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  // Clear any stale/orphaned sessions when the login page loads
  useEffect(() => {
    supabase.auth.signOut();
  }, [supabase]);

  const handleLogin = async (provider: "google" | "linkedin_oidc") => {
    if (provider === "google") setIsLoadingGoogle(true);
    if (provider === "linkedin_oidc") setIsLoadingLinkedin(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setMessage({ text: error.message, type: "error" });
      setIsLoadingGoogle(false);
      setIsLoadingLinkedin(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoadingEmail(true);
    setMessage(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ 
        text: "Password reset link sent! Check your email.", 
        type: "success" 
      });
      // Don't switch view yet, let them read the message
    }
    
    setIsLoadingEmail(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoadingEmail(true);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ 
          text: "Success! Check your email to confirm your account (or just log in if email confirmations are disabled).", 
          type: "success" 
        });
        setIsSignUp(false); // Switch to login view
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        router.push("/onboarding"); // Route successfully logged in users to onboarding process
      }
    }
    
    setIsLoadingEmail(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            {isForgotPassword ? (
              <KeyRound className="h-6 w-6 text-primary" />
            ) : (
              <Compass className="h-6 w-6 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isForgotPassword ? "Reset Password" : "Welcome to Pathfinder"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isForgotPassword 
              ? "Enter your email to receive a password reset link."
              : "Sign in to start navigating your career and life goals."}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-md text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
            {message.text}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoadingEmail}
            >
              {isLoadingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Reset Link
            </Button>

            <div className="text-center text-sm pt-2">
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage(null);
                }}
                className="text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage(null);
                    }} 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input 
                id="password" 
                type="password"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoadingEmail || isLoadingGoogle || isLoadingLinkedin}
            >
              {isLoadingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isSignUp ? "Create Account" : "Sign In with Email"}
            </Button>

            <div className="text-center text-sm pt-2">
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className="text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        {!isForgotPassword && (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                onClick={() => handleLogin("google")}
                disabled={isLoadingGoogle || isLoadingLinkedin}
              >
                {isLoadingGoogle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2 h-11 border-blue-200 hover:bg-blue-50/50"
                onClick={() => handleLogin("linkedin_oidc")}
                disabled={isLoadingGoogle || isLoadingLinkedin}
              >
                {isLoadingLinkedin ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                ) : (
                  <LinkedInLogoIcon className="h-5 w-5 text-[#0A66C2]" />
                )}
                <span className="text-[#0A66C2] font-semibold">Continue with LinkedIn</span>
              </Button>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
