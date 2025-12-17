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
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/campaigns"
          className="mb-4 inline-block text-white/60 hover:text-white"
        >
          ← Back to Campaigns
        </Link>

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-4xl font-bold text-white">
            Create New Campaign
          </h1>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg bg-white/10 p-6"
          >
            {error && (
              <div className="mb-4 rounded bg-red-500/20 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white"
              >
                Campaign Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder="The Lost Mines of Phandelver"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-white"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder="A brief description of your campaign..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createCampaign.isPending}
                className="rounded-md bg-[hsl(280,100%,70%)] px-6 py-2 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:opacity-50"
              >
                {createCampaign.isPending ? "Creating..." : "Create Campaign"}
              </button>
              <Link
                href="/campaigns"
                className="rounded-md bg-white/10 px-6 py-2 font-semibold text-white transition hover:bg-white/20"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


