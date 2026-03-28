"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

export default function LoginPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingLinkedin, setIsLoadingLinkedin] = useState(false);

  // We are running in mock mode for the hackathon unless env vars exist
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined;

  const handleLogin = async (provider: "google" | "linkedin_oidc") => {
    if (!hasSupabase) {
      alert("Supabase keys not found in .env.local! Running in mock mode.");
      window.location.href = "/onboarding";
      return;
    }

    if (provider === "google") setIsLoadingGoogle(true);
    if (provider === "linkedin_oidc") setIsLoadingLinkedin(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setIsLoadingGoogle(false);
      setIsLoadingLinkedin(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Pathfinder</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to start navigating your career and life goals.
          </p>
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

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
