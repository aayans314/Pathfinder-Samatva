"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Authentication Failed
          </h1>
          <p className="text-muted-foreground">
            Something went wrong during sign-in. This can happen if the session
            expired or the authentication provider returned an error.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
