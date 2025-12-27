"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/campaigns");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-[450px] bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center justify-center mb-6">
            <Image
              src="/images/tlr_logo.png"
              alt="The Long Rest"
              width={200}
              height={60}
              className="h-auto"
              priority
            />
          </div>
          <h2 className="card-title justify-center mb-2">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text">Email</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="input input-bordered w-full bg-base-100 border-2 border-base-300 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text">Password</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input input-bordered w-full bg-base-100 border-2 border-base-300 focus:border-primary focus:outline-none"
              />
            </div>

            <button type="submit" className="app-btn app-btn-primary w-full justify-center" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-sm text-base-content/60">
              Don't have an account?{" "}
              <Link href="/register" className="link link-primary font-semibold">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


