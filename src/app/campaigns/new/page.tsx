"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const createCampaign = api.campaign.create.useMutation({
    onSuccess: (data) => {
      router.push(`/campaigns/${data.id}`);
    },
    onError: (err) => {
      setError(err.message || "Failed to create campaign");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Campaign name is required");
      return;
    }

    createCampaign.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <Link href="/campaigns" className="text-sm text-base-content/60 hover:text-base-content">
            ← Back to Campaigns
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300/60">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-1">Create New Campaign</h1>
            <p className="text-sm text-base-content/60 mb-4">
              Set up a new world for your adventures. You can always edit details later.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control">
                <label htmlFor="name" className="label">
                  <span className="label-text">
                    Campaign Name <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input input-bordered w-full bg-base-100 border-2 border-base-300 focus:border-primary focus:outline-none"
                  placeholder="The Lost Mines of Phandelver"
                />
              </div>

              <div className="form-control">
                <label htmlFor="description" className="label">
                  <span className="label-text">Description (optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="textarea textarea-bordered w-full bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                  placeholder="A brief description of your campaign..."
                />
              </div>

              <div className="card-actions justify-end gap-3 pt-2">
                <Link href="/campaigns" className="app-btn app-btn-ghost">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createCampaign.isPending}
                  className="app-btn app-btn-primary"
                >
                  {createCampaign.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Create Campaign"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


