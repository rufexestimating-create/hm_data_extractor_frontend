"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthLayout, FormError, PasswordField, SubmitButton } from "@/components/AuthLayout";

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login?reset=1");
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a strong new password for your account"
      headline={<>Set a new <span className="underline decoration-white/60 underline-offset-4">password</span> for your account</>}
      footer={<></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <PasswordField label="New password" required autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD} characters`}
                       value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        <PasswordField label="Confirm new password" required autoComplete="new-password" placeholder="Re-enter your new password"
                       value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
        <FormError message={error} />
        <SubmitButton loading={loading}>Update Password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
