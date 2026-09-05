import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import heroImg from "@/assets/atelier.jpg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create an Account | Timera" },
      { name: "description", content: "Sign in to your Timera account to track orders, save timepieces to your wishlist and access member previews." },
      { property: "og:title", content: "Sign in — Timera" },
      { property: "og:description", content: "Access your Timera account." },
      { property: "og:url", content: "https://timera.store/auth" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/account" });
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Reset link sent");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/account" });
  };

  return (
    <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src={heroImg} alt="The Timera atelier" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/40 to-transparent" />
        <div className="absolute bottom-16 left-16 max-w-md text-background">
          <p className="text-[11px] uppercase tracking-[0.3em]">Le Cercle</p>
          <h2 className="mt-3 font-serif text-4xl">Discretion, delivered.</h2>
          <p className="mt-4 text-background/80">Members receive private previews, atelier stories, and priority access to limited editions.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="font-serif text-2xl gold-text">TIMERA</Link>
          <h1 className="mt-8 font-serif text-4xl">
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" && "Sign in to access your orders, wishlist, and rewards."}
            {mode === "register" && "Join Le Cercle and unlock member-only privileges."}
            {mode === "forgot" && "We'll send a secure link to your email."}
          </p>

          <Button variant="outline" className="mt-8 w-full h-12" onClick={google} disabled={loading}>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "register" && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Full name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-12" />
              </div>
            )}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-12"
                placeholder="you@example.com"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
                <Input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 h-12"
                />
              </div>
            )}
            <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
              {mode === "login" && (loading ? "Signing in…" : "Sign in")}
              {mode === "register" && (loading ? "Creating…" : "Create account")}
              {mode === "forgot" && (loading ? "Sending…" : "Send reset link")}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                <p>
                  New here?{" "}
                  <button onClick={() => setMode("register")} className="text-primary hover:underline">Create an account</button>
                </p>
                <p>
                  <button onClick={() => setMode("forgot")} className="text-primary hover:underline">Forgot your password?</button>
                </p>
              </>
            )}
            {mode !== "login" && (
              <p>
                <button onClick={() => setMode("login")} className="text-primary hover:underline">Back to sign in</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
