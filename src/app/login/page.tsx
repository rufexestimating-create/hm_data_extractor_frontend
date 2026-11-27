"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRedirectIfSignedIn } from "@/lib/auth";
import { AuthLayout, Field, FormError, PasswordField, SubmitButton } from "@/components/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  useRedirectIfSignedIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resetDone = params.get("reset") === "1";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError(/invalid login/i.test(err.message) ? "Incorrect email or password." : err.message);
      setLoading(false);
      return;
    }
    router.replace("/");
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Welcome back! Please enter your details"
      headline={<>Welcome back! Please sign in to your <span className="underline decoration-white/60 underline-offset-4">HM Data Extractor</span> account</>}
      footer={<>Don&apos;t have an account? <Link href="/signup" className="font-semibold text-text hover:text-accent">Sign up</Link></>}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email" type="email" required autoComplete="email" placeholder="Enter your email"
               value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <div>
          <PasswordField label="Password" required autoComplete="current-password" placeholder="Enter your password"
                         value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          <div className="text-right mt-1.5">
            <Link href="/forgot-password" className="text-[11px] text-accent hover:underline">Forgot password?</Link>
          </div>
        </div>
        {resetDone && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Password updated! Please sign in with your new password.
          </div>
        )}
        <FormError message={error} />
        <SubmitButton loading={loading}>Sign In</SubmitButton>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
