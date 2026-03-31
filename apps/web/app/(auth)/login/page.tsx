"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCapIcon, Mail, Lock, User, ArrowRight, Loader2, Github, Chrome } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, RadioGroup, RadioGroupItem } from "@repo/ui";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");

  const handleAuth = async (type: "login" | "signup") => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (type === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${role === 'instructor' ? '/instructor' : '/dashboard'}`,
          },
        });

        if (error) throw error;

        toast.success("Account created! Please check your email for verification.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back!");

        // Fetch profile to see where to redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const redirectPath = profile?.role === "instructor" ? "/instructor" : "/dashboard";
        router.push(redirectPath);
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen hero-bg flex flex-col font-sans selection:bg-primary/20 overflow-y-auto">
      {/* Simple Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 sm:py-5 shrink-0">
        <Link href="/" className="flex items-center gap-3.5 group transition-transform active:scale-[0.98]">
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-[1.25rem] bg-primary/5 flex items-center justify-center p-1 group-hover:bg-primary/10 transition-colors shadow-sm">
            <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-125" />
          </div>
          <span className="font-bold text-2xl tracking-tight gradient-text">Eduvora</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-[480px] bg-background border border-border rounded-[2.5rem] shadow-2xl shadow-black/10 overflow-hidden relative">
          <Tabs defaultValue="login" className="flex flex-col w-full">
            <div className="px-6 py-6 sm:p-10 pb-4 text-center">
              <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground">Welcome to Eduvora</h1>
              <p className="text-muted-foreground text-sm">Empowering your journey through knowledge.</p>
            </div>

            <div className="px-6 sm:px-10 pb-4">
              <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl bg-muted/50 p-1">
                <TabsTrigger value="login" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 pt-4 sm:p-10 space-y-6">
              <TabsContent value="login" className="mt-0 space-y-5 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold ml-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-11 h-12 rounded-2xl bg-muted/5 border-border focus-visible:ring-2 focus-visible:ring-primary shadow-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="font-bold ml-1">Password</Label>
                      <button className="text-xs text-primary font-bold hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-11 h-12 rounded-2xl bg-muted/5 border-border focus-visible:ring-2 focus-visible:ring-primary shadow-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleAuth("login")}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-foreground text-background font-black hover:bg-zinc-800 transition-all active:scale-[0.98] gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Sign In to Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="mt-0 space-y-5 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold ml-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-11 h-12 rounded-2xl bg-muted/5 border-border focus-visible:ring-2 focus-visible:ring-primary shadow-none"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-up" className="font-bold ml-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email-up"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-11 h-12 rounded-2xl bg-muted/5 border-border focus-visible:ring-2 focus-visible:ring-primary shadow-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-up" className="font-bold ml-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password-up"
                        type="password"
                        placeholder="••••••••"
                        className="pl-11 h-12 rounded-2xl bg-muted/5 border-border focus-visible:ring-2 focus-visible:ring-primary shadow-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="font-bold ml-1">Join as a...</Label>
                    <RadioGroup
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      value={role}
                      onValueChange={(val) => setRole(val as any)}
                    >
                      <div>
                        <RadioGroupItem value="student" id="student" className="peer sr-only" />
                        <Label
                          htmlFor="student"
                          onClick={() => setRole("student")}
                          className={
                            "flex flex-col items-center justify-between rounded-xl border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer min-h-[84px] " +
                            (role === "student"
                              ? "border-primary bg-primary/5"
                              : "border-muted bg-popover/50")
                          }
                        >
                          <GraduationCapIcon className="mb-2 h-6 w-6" />
                          <span className="text-xs font-bold uppercase tracking-wider">Student</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="instructor" id="instructor" className="peer sr-only" />
                        <Label
                          htmlFor="instructor"
                          onClick={() => setRole("instructor")}
                          className={
                            "flex flex-col items-center justify-between rounded-xl border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer min-h-[84px] " +
                            (role === "instructor"
                              ? "border-primary bg-primary/5"
                              : "border-muted bg-popover/50")
                          }
                        >
                          <User className="mb-2 h-6 w-6" />
                          <span className="text-xs font-bold uppercase tracking-wider">Instructor</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Button
                  onClick={() => handleAuth("signup")}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black hover:bg-primary/90 transition-all active:scale-[0.98] gap-2 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TabsContent>


              <p className="text-center text-[10px] text-muted-foreground px-6 leading-relaxed">
                By continuing, you agree to Eduvora's <Link href="#" className="underline underline-offset-2">Terms of Service</Link> and <Link href="#" className="underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

