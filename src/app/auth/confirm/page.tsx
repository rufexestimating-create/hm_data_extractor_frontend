"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/AuthLayout";

function AuthConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type = params.get("type") as "signup" | "recovery" | "email" | null;

    if (!token_hash || !type) {
      setError("Invalid or expired link. Please try again.");
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type }).then(({ error: err }) => {
      if (err) {
        setError(err.message.includes("expired") ? "This link has expired. Please request a new one." : err.message);
        return;
      }
      if (type === "recovery") {
        router.replace("/reset-password");
      } else {
        router.replace("/");
      }
    });
  }, [params, router]);

  if (error) {
    return (
      <AuthLayout
        title="Link Error"
        subtitle="Something went wrong with this link"
        headline={<>Verification <span className="underline decoration-white/60 underline-offset-4">failed</span></>}
        footer={<></>}
      >
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <XCircle size={32} />
          </div>
          <p className="text-xs text-text-muted text-center leading-relaxed">{error}</p>
          <a href="/login" className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
            Back to Sign In
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verifying…"
      subtitle="Please wait a moment"
      headline={<>Verifying your <span className="underline decoration-white/60 underline-offset-4">account</span></>}
      footer={<></>}
    >
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 size={36} className="animate-spin text-accent" />
        <p className="text-xs text-text-muted">Confirming your email…</p>
      </div>
    </AuthLayout>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense>
      <AuthConfirmContent />
    </Suspense>
  );
}
