"use client";

import { useEffect, useState } from "react";
import { User, Bell, Shield, Wallet, Globe, Mail, Loader2, Camera } from "lucide-react";
import { Button } from "@repo/ui";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui";
import { toast } from "sonner";
import { useUIStore } from "@/lib/store";

const SETTINGS_TABS = [
  { id: "account", label: "My Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const supabase = createClient();
  const { setProfile: setGlobalProfile } = useUIStore();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!profile || !profile.id) return;
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      setGlobalProfile({ ...profile, avatar_url: publicUrl }); // sync with global store
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error("Error uploading avatar", { description: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
     );
  }
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4">
      {/* Header Section */}
      <div className="space-y-4">
        <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Account Ecosystem</span>
        <h1 className="text-5xl font-bold tracking-tighter text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 pt-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              className="w-full flex items-center gap-3.5 px-6 py-4 rounded-xl text-[14px] font-bold text-muted-foreground hover:bg-[#F5F7FA] hover:text-foreground transition-all duration-200"
            >
              <tab.icon className="h-5 w-5" strokeWidth={2.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-premium border-none relative overflow-hidden group">
          <div className="space-y-12">
             <div className="space-y-8">
                 <div className="flex items-center justify-between border-b border-border/50 pb-8">
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight">Profile Essence</h3>
                      <p className="text-[14px] text-muted-foreground">Manage your public persona and core identity.</p>
                   </div>
                   <Button className="h-11 px-8 rounded-xl bg-foreground text-white font-bold text-[13px] hover:bg-zinc-800">
                     Update Data
                   </Button>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 rounded-3xl border-2 border-white shadow-xl bg-zinc-100 shrink-0">
                      <AvatarFallback className="text-4xl font-black bg-zinc-100 text-zinc-400">
                        {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Student"} className="object-cover" />
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                      {uploadingAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                    </label>
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[20px] font-bold tracking-tight text-foreground">{profile?.full_name || "Eduvora Student"}</h3>
                    <p className="text-[13px] font-semibold text-muted-foreground">Student Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                   <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-foreground/40 tracking-widest pl-1">Legal Name</label>
                      <input 
                        defaultValue={profile?.full_name || ""}
                        className="w-full h-14 px-6 rounded-2xl bg-[#F5F7FA] border-none text-[15px] font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-foreground/40 tracking-widest pl-1">Email Domain</label>
                      <input 
                        defaultValue={profile?.email || ""}
                        readOnly
                        className="w-full h-14 px-6 rounded-2xl bg-[#F5F7FA] border-none text-[15px] font-bold text-foreground/60 cursor-not-allowed outline-none transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-foreground/40 tracking-widest pl-1">Professional Bio</label>
                    <textarea 
                      defaultValue={profile?.bio || "Elevating digital standards through meticulous design and continuous learning. Architectural enthusiast and aspiring maestro."}
                      className="w-full h-32 px-6 py-5 rounded-2xl bg-[#F5F7FA] border-none text-[15px] font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
