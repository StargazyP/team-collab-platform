"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStep("reset");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-medium text-foreground mb-2">
            {step === "done" ? "Password Reset" : "Forgot Password"}
          </h2>
          <p className="text-sm text-default-600">
            {step === "email" && "Enter your email to reset password"}
            {step === "reset" && "Enter your new password"}
            {step === "done" && "Your password has been updated"}
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-600">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-default-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md bg-content1 border border-default-300 px-3 py-2 text-sm text-content1-foreground placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="rounded-md bg-content1 border border-default-200 px-4 py-3 text-sm text-default-700">
                {email}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-default-700 mb-1.5">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md bg-content1 border border-default-300 px-3 py-2 text-sm text-content1-foreground placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-default-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md bg-content1 border border-default-300 px-3 py-2 text-sm text-content1-foreground placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); }}
                className="w-full rounded-md border border-default-300 bg-content1 px-4 py-2 text-sm font-medium text-foreground hover:border-primary-300 hover:bg-content2 transition-colors"
              >
                Back
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="rounded-md bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700">
                Password updated successfully. You can now sign in.
              </div>
              <Link
                href="/login"
                className="block w-full text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-600 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {step !== "done" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-default-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-default-500">
                    Remember your password?
                  </span>
                </div>
              </div>
              <Link
                href="/login"
                className="block w-full text-center rounded-md border border-default-300 bg-content1 px-4 py-2 text-sm font-medium text-foreground hover:border-primary-300 hover:bg-content2 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
