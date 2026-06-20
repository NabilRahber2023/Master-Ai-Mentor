"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User as UserIcon,
  ShieldCheck,
  Palette,
  Bell,
  Building2,
  LogOut,
  Loader2,
  Save,
  Check,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { authClient } from "@/lib/auth-client";
import { useTenant } from "@/hooks/use-tenant";

type TabId = "profile" | "security" | "appearance" | "notifications" | "organization";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "organization", label: "Organization", icon: Building2 },
];

const inputClass =
  "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-400/60 focus:bg-white/10 disabled:opacity-50";

const cardClass = "rounded-xl border border-[#3b494c]/20 bg-[#1c2022]/60 p-6";

function PrimaryButton({
  loading,
  children,
  ...props
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? "bg-cyan-500" : "bg-white/15"}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[1.375rem]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

const PREF_KEY = "ai-mentor-notification-prefs";
const DEFAULT_PREFS = { emailDigest: true, predictionAlerts: true, productUpdates: false };

export default function SettingsPage() {
  const router = useRouter();
  const tenant = useTenant();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<TabId>("profile");

  // Profile
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Notifications (persisted in localStorage)
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  async function saveProfile() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) throw new Error(error.message);
      toast.success("Profile updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      });
      if (error) throw new Error(error.message);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  }

  function updatePref(key: keyof typeof DEFAULT_PREFS, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
    toast.success("Preference saved");
  }

  async function signOut() {
    try {
      await authClient.signOut();
      toast.success("Signed out");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  }

  const initials = (session?.user?.name || session?.user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-[#101416] text-[#e0e3e6] font-body selection:bg-cyan-500/30 selection:text-cyan-200">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#3b494c]/10 px-6 bg-[#101416] sticky top-0 z-50">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-headline text-slate-300 uppercase tracking-widest text-[10px]">
                Settings
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-bold text-white tracking-tighter uppercase">Settings</h1>
          <p className="text-[10px] text-slate-400 font-headline uppercase tracking-[0.2em] mt-1">
            Account · Security · Workspace Preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* Tab nav */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-400/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Tab content */}
          <div className="space-y-6">
            {tab === "profile" && (
              <div className={cardClass}>
                <h2 className="mb-1 text-lg font-semibold text-white">Profile</h2>
                <p className="mb-5 text-sm text-slate-400">Update your personal information.</p>
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-xl font-bold text-white">
                    {initials}
                  </div>
                  <div className="text-sm text-slate-400">Signed in as<br /><span className="text-white">{session?.user?.email ?? "—"}</span></div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full Name">
                    <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </Field>
                  <Field label="Email (read-only)">
                    <input className={inputClass} value={session?.user?.email ?? ""} disabled />
                  </Field>
                </div>
                <div className="mt-5">
                  <PrimaryButton loading={savingProfile} onClick={saveProfile}>
                    <Save className="h-4 w-4" /> Save Changes
                  </PrimaryButton>
                </div>
              </div>
            )}

            {tab === "security" && (
              <div className={cardClass}>
                <h2 className="mb-1 text-lg font-semibold text-white">Change Password</h2>
                <p className="mb-5 text-sm text-slate-400">Use at least 8 characters.</p>
                <div className="grid max-w-md grid-cols-1 gap-4">
                  <Field label="Current Password">
                    <input type="password" className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
                  </Field>
                  <Field label="New Password">
                    <input type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                  </Field>
                  <Field label="Confirm New Password">
                    <input type="password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                  </Field>
                  <label className="flex items-center gap-2.5 text-sm text-slate-300">
                    <Toggle on={revokeOthers} onChange={setRevokeOthers} />
                    Sign out of all other devices
                  </label>
                </div>
                <div className="mt-5">
                  <PrimaryButton loading={changingPw} onClick={changePassword}>
                    <ShieldCheck className="h-4 w-4" /> Update Password
                  </PrimaryButton>
                </div>
              </div>
            )}

            {tab === "appearance" && (
              <div className={cardClass}>
                <h2 className="mb-1 text-lg font-semibold text-white">Appearance</h2>
                <p className="mb-5 text-sm text-slate-400">Choose your interface theme.</p>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {(["light", "dark", "system"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTheme(opt);
                        toast.success(`Theme: ${opt}`);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm capitalize transition-colors ${
                        theme === opt
                          ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/30"
                      }`}
                    >
                      {theme === opt && <Check className="h-4 w-4" />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "notifications" && (
              <div className={cardClass}>
                <h2 className="mb-1 text-lg font-semibold text-white">Notifications</h2>
                <p className="mb-5 text-sm text-slate-400">Control what updates you receive. Saved to this browser.</p>
                <div className="space-y-4 max-w-lg">
                  {[
                    { key: "emailDigest" as const, label: "Weekly email digest", desc: "Summary of activity and insights" },
                    { key: "predictionAlerts" as const, label: "Prediction alerts", desc: "Notify when at-risk students are detected" },
                    { key: "productUpdates" as const, label: "Product updates", desc: "New features and announcements" },
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-white">{row.label}</p>
                        <p className="text-[11px] text-slate-400">{row.desc}</p>
                      </div>
                      <Toggle on={prefs[row.key]} onChange={(v) => updatePref(row.key, v)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "organization" && (
              <div className={cardClass}>
                <h2 className="mb-1 text-lg font-semibold text-white">Organization</h2>
                <p className="mb-5 text-sm text-slate-400">Your workspace details.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Organization"><input className={inputClass} value={tenant?.organizationName ?? "—"} disabled /></Field>
                  <Field label="Workspace Slug"><input className={inputClass} value={tenant?.slug ?? "—"} disabled /></Field>
                  <Field label="Plan"><input className={inputClass} value={tenant?.packageId ? tenant.packageId[0].toUpperCase() + tenant.packageId.slice(1) : "—"} disabled /></Field>
                  <Field label="Your Role"><input className={inputClass} value={tenant?.userRole ? tenant.userRole[0].toUpperCase() + tenant.userRole.slice(1) : "—"} disabled /></Field>
                </div>
                <div className="mt-5">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Enabled Modules ({tenant?.enabledModules.length ?? 0})</p>
                  <div className="flex flex-wrap gap-2">
                    {(tenant?.enabledModules ?? []).map((m) => (
                      <span key={m} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {m.replace(/-/g, " ")}
                      </span>
                    ))}
                    {(!tenant || tenant.enabledModules.length === 0) && <span className="text-sm text-slate-500">None</span>}
                  </div>
                </div>
                {tenant && (
                  <div className="mt-6">
                    <Link href={`/${tenant.slug}/home`} className="text-sm text-cyan-400 hover:text-cyan-300">
                      ← Back to dashboard
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Sign out — always available */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <h2 className="mb-1 text-lg font-semibold text-white">Session</h2>
              <p className="mb-4 text-sm text-slate-400">Sign out of your account on this device.</p>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
