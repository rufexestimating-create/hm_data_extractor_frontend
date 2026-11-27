"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { API, supabase } from "@/lib/supabase";
import { useRedirectIfSignedIn } from "@/lib/auth";
import { AuthLayout, Field, FormError, PasswordField, SubmitButton } from "@/components/AuthLayout";

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const router = useRouter();
  useRedirectIfSignedIn();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      // Backend validates inputs + rate-limits
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === "string" ? body.detail : "Could not create the account.");
      }

      // Create account via Supabase — sends verification email automatically
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (err) {
        if (/already registered/i.test(err.message)) {
          throw new Error("An account with this email already exists. Please sign in.");
        }
        throw new Error(err.message);
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof TypeError ? "Cannot reach the server. Is the backend running?" : (err as Error).message);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a verification link to ${email}`}
        headline={<>Almost there! Verify your <span className="underline decoration-white/60 underline-offset-4">email address</span></>}
        footer={<>Already verified? <Link href="/login" className="font-semibold text-text hover:text-accent">Sign in</Link></>}
      >
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MailCheck size={32} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm text-text font-medium">Verification email sent!</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Click the link in your email to activate your account. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to start extracting directory data"
      headline={<>Create your <span className="underline decoration-white/60 underline-offset-4">HM Data Extractor</span> account</>}
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-text hover:text-accent">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full name" type="text" required autoComplete="name" placeholder="Enter your full name"
               value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        <Field label="Email" type="email" required autoComplete="email" placeholder="Enter your email"
               value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <PasswordField label="Password" required autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD} characters`}
                       value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        <PasswordField label="Confirm password" required autoComplete="new-password" placeholder="Re-enter your password"
                       value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
        <FormError message={error} />
        <SubmitButton loading={loading}>Create Account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
