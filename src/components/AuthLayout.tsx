"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import ExtractorIllustration from "./ExtractorIllustration";

export function AuthLayout({ title, subtitle, headline, children, footer }: {
  title: string;
  subtitle: string;
  headline: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-bg">
      {/* form side */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">HM</span>
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base text-text tracking-tight">Data Extractor</div>
              <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">by HM Design Group</div>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-2xl p-5 sm:p-6">
            <h1 className="text-lg font-bold text-text text-center">{title}</h1>
            <p className="text-xs text-text-muted text-center mt-1 mb-4">{subtitle}</p>
            {children}
          </div>
          <p className="text-xs text-text-muted text-center mt-4">{footer}</p>
        </div>
      </div>

      {/* showcase side */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between rounded-3xl m-3 p-8 xl:p-10 overflow-hidden relative
                      bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative text-center mt-2">
          <h2 className="text-2xl xl:text-3xl font-bold leading-tight tracking-tight">{headline}</h2>
          <p className="text-sm text-white/75 mt-3 max-w-md mx-auto leading-relaxed">
            Paste any directory link and let the agent collect clean business data: names, websites, emails
            and phones. Everything is saved privately to your own account.
          </p>
        </div>
        <div className="relative flex-1 flex items-center justify-center">
          <ExtractorIllustration />
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-bg border border-border rounded-xl px-3.5 py-2 text-sm text-text placeholder:text-text-muted " +
  "focus:border-accent transition-colors disabled:opacity-50";

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-text-secondary mb-1">{label}</span>
      <input {...props} className={inputCls} />
    </label>
  );
}

export function PasswordField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-text-secondary mb-1">{label}</span>
      <span className="relative block">
        <input {...props} type={show ? "text" : "password"} className={`${inputCls} pr-10`} />
        <button
          type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </span>
    </label>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold
                 cursor-pointer hover:bg-accent-hover active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
      {message}
    </div>
  );
}
