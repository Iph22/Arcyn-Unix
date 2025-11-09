import { SignInButton } from "@/components/auth/sign-in-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <h1 className="relative text-6xl font-bold tracking-tighter bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
                ARCYN UNIX
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Unified AI Interface
          </p>
          <p className="text-sm text-muted-foreground/60">
            Minimal. Sharp. Intentional.
          </p>
        </div>

        {/* Sign In Card */}
        <div className="glass-strong rounded-2xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Welcome</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your unified AI workspace
            </p>
          </div>

          <div className="flex justify-center">
            <SignInButton />
          </div>

          <div className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl">🤖</div>
            <p className="text-xs text-muted-foreground">Multiple AI Models</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">⚡</div>
            <p className="text-xs text-muted-foreground">Lightning Fast</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🔒</div>
            <p className="text-xs text-muted-foreground">Secure & Private</p>
          </div>
        </div>
      </div>
    </div>
  );
}