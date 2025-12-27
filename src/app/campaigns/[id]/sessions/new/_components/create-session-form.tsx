"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface CreateSessionFormProps {
  campaignId: string;
}

export function CreateSessionForm({ campaignId }: CreateSessionFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const createSessionMutation = api.session.create.useMutation({
    onSuccess: (session) => {
      router.push(`/sessions/${session.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createSessionMutation.mutate({
      campaignId,
      name: name.trim(),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div>
        <label htmlFor="sessionName" className="mb-2 block text-sm font-medium text-white">
          Session Name
        </label>
        <input
          id="sessionName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Session 1: The Adventure Begins"
          required
          className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
        />
      </div>

      <div>
        <label htmlFor="scheduledAt" className="mb-2 block text-sm font-medium text-white">
          Scheduled Date & Time (Optional)
        </label>
        <input
          id="scheduledAt"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded bg-white/10 px-4 py-2 text-white"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={createSessionMutation.isPending}
          className="rounded bg-[hsl(280,100%,70%)] px-6 py-2 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:opacity-50"
        >
          {createSessionMutation.isPending ? "Creating..." : "Create Session"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded bg-white/10 px-6 py-2 text-white transition hover:bg-white/20"
        >
          Cancel
        </button>
      </div>

      {createSessionMutation.error && (
        <p className="text-sm text-red-400">
          {createSessionMutation.error.message}
        </p>
      )}
    </form>
  );
}

