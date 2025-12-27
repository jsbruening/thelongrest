"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = api.user.register.useMutation({
    onSuccess: () => {
      router.push("/login");
    },
    onError: (err) => {
      setError(err.message || "Registration failed");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    registerMutation.mutate({
      email,
      password,
      name: name || undefined,
    });
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
          <h2 className="card-title justify-center mb-2">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label" htmlFor="name">
                <span className="label-text">Name (optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="input input-bordered w-full bg-base-100 border-2 border-base-300 focus:border-primary focus:outline-none"
              />
            </div>

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
                autoComplete="new-password"
                className="input input-bordered w-full bg-base-100 border-2 border-base-300 focus:border-primary focus:outline-none"
              />
              <label className="label" htmlFor="passwordHelper">
                <span className="label-text-alt" id="passwordHelper">At least 8 characters</span>
              </label>
            </div>

            <button type="submit" className="app-btn app-btn-primary w-full justify-center" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-base-content/60">
              Already have an account?{" "}
              <Link href="/login" className="link link-primary font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


