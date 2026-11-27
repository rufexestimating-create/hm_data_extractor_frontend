"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthLayout, Field, FormError, SubmitButton } from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`Password reset link sent to ${email}`}
        headline={<>Reset your <span className="underline decoration-white/60 underline-offset-4">password</span></>}
        footer={<><Link href="/login" className="font-semibold text-text hover:text-accent">Back to Sign In</Link></>}
      >
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MailCheck size={32} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm text-text font-medium">Reset link sent!</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Check your inbox and click the link to reset your password. The link expires in 1 hour.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link"
      headline={<>Reset your <span className="underline decoration-white/60 underline-offset-4">HM Data Extractor</span> password</>}
      footer={<>Remember your password? <Link href="/login" className="font-semibold text-text hover:text-accent">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" placeholder="Enter your email address"
               value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <FormError message={error} />
        <SubmitButton loading={loading}>Send Reset Link</SubmitButton>
      </form>
    </AuthLayout>
  );
}
