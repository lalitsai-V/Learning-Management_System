"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@repo/ui";
import { toast } from "sonner";
import { Save, User, Mail, Link as LinkIcon, BookOpen, Globe, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui";
import { useUIStore } from "@/lib/store";

export default function InstructorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const { setProfile } = useUIStore();
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    title: "",
    bio: "",
    website: "",
    twitter: "",
    expertise: "Development",
    notifyEnrollments: true,
    notifyQuestions: true,
    avatarUrl: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfileId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setForm({
            fullName: profile.full_name || "",
            email: profile.email || user.email || "",
            // Mapping existing DB columns and providing defaults for others
            title: profile.instructor_title || "Instructor", 
            bio: profile.bio || "",
            website: profile.website || "",
            twitter: profile.twitter || "",
            expertise: profile.expertise || "Development",
            notifyEnrollments: profile.notify_enrollments ?? true,
            notifyQuestions: profile.notify_questions ?? true,
            avatarUrl: profile.avatar_url || "",
          });
          setProfile(profile);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!profileId) {
      toast.error("You must be logged in to save settings.");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.fullName,
          avatar_url: form.avatarUrl,
          instructor_title: form.title,
          bio: form.bio,
          website: form.website,
          twitter: form.twitter,
          expertise: form.expertise,
          notify_enrollments: form.notifyEnrollments,
          notify_questions: form.notifyQuestions,
        })
        .eq("id", profileId);

      if (error) throw error;
      
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (updatedProfile) setProfile(updatedProfile);

      toast.success("Settings saved!", { description: "Your instructor profile has been updated." });
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profileId) return;

    setSaving(true);
    try {
      // 1. Upload image to 'avatars' bucket
      const fileExt = file.name.split('.').pop();
      const filePath = `${profileId}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profiles table immediately for persistence
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profileId);

      if (profileError) throw profileError;

      // 4. Update state and also the global store
      update("avatarUrl", publicUrl);
      
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (updatedProfile) setProfile(updatedProfile);
      
      toast.success("Photo uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Instructor Profile</span>
        <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>
          Settings
        </h1>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-2xl border border-border/60 p-8 flex items-center gap-8 shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
          <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black">
            {(form.fullName || "U")[0]}
          </AvatarFallback>
          <AvatarImage src={form.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileId}`} className="object-cover" />
        </Avatar>
        <div className="space-y-3">
          <div>
            <h2 className="font-bold text-xl tracking-tight">{form.fullName || "User Name"}</h2>
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{form.title || "No Title Set"}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={saving}
            />
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="h-9 px-4 rounded-xl font-bold border-border/60 hover:bg-muted/50 cursor-pointer"
            >
              <label htmlFor="avatar-upload">
                {saving ? "Uploading..." : "Change Photo"}
              </label>
            </Button>
            {form.avatarUrl && (
               <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-4 rounded-xl font-bold text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={() => update("avatarUrl", "")}
               >
                 Remove
               </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-border/50">
          <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </h2>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="w-full h-12 bg-[#F5F7FA] border-none rounded-xl px-4 text-[14px] font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Instructor Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="w-full h-12 bg-[#F5F7FA] border-none rounded-xl px-4 text-[14px] font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Senior Instructor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full h-12 bg-[#F5F7FA]/50 border-none rounded-xl pl-11 pr-4 text-[14px] font-semibold text-muted-foreground/70 outline-none transition-all cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 text-[14px] font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Primary Expertise</label>
            <div className="flex flex-wrap gap-2">
              {["Development", "Design", "Business", "Marketing", "Photography", "Music"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => update("expertise", cat)}
                  className={`h-9 px-4 rounded-xl text-[12px] font-bold border-2 transition-all ${
                    form.expertise === cat
                      ? "bg-primary/5 border-primary/40 text-primary"
                      : "bg-white border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-border/50">
          <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Social Links
          </h2>
        </div>
        <div className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Website</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                className="w-full h-12 bg-[#F5F7FA] border-none rounded-xl pl-11 pr-4 text-[14px] font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Twitter / X</label>
            <input
              type="text"
              value={form.twitter}
              onChange={(e) => update("twitter", e.target.value)}
              className="w-full h-12 bg-[#F5F7FA] border-none rounded-xl px-4 text-[14px] font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="@username"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-border/50">
          <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Notification Preferences
          </h2>
        </div>
        <div className="p-8 space-y-5">
          {[
            { key: "notifyEnrollments", label: "New Enrollments", desc: "Get notified when a student enrolls in your course" },
            { key: "notifyQuestions", label: "Student Questions", desc: "Get notified when a student asks a question" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">{n.label}</p>
                <p className="text-[12px] text-muted-foreground font-medium">{n.desc}</p>
              </div>
              <button
                onClick={() => update(n.key, !form[n.key as keyof typeof form])}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form[n.key as keyof typeof form] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${
                    form[n.key as keyof typeof form] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-10 rounded-2xl bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
