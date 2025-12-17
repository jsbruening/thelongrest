"use client";

import { useRouter } from "next/navigation";
import { Plus, BookOpen, Users, Calendar } from "lucide-react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function CampaignsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { data: campaigns = [], isLoading, error, isError } = api.campaign.getAll.useQuery(
    undefined,
    {
      enabled: sessionStatus === "authenticated",
      retry: (failureCount, error) => {
        if (error?.data?.code === "UNAUTHORIZED") {
          return false;
        }
        return failureCount < 2;
      },
    }
  );

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-base-content mb-2">Campaigns</h1>
            <p className="text-base-content/60">Manage your D&D campaigns and sessions</p>
          </div>
          <button
            onClick={() => router.push("/campaigns/new")}
            className="btn btn-primary gap-2"
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </button>
        </div>

        {/* Content */}
        {sessionStatus === "loading" ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : isError ? (
          <div className="alert alert-error shadow-lg">
            <span>
              {error?.data?.code === "UNAUTHORIZED"
                ? "Please log in to view campaigns"
                : `Error loading campaigns: ${error?.message ?? "Unknown error"}`}
            </span>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card bg-base-200 shadow-md">
                <div className="card-body flex h-[200px] items-center justify-center">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card bg-base-200 shadow-lg max-w-2xl mx-auto">
            <div className="card-body py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-base-content/40" />
              <h3 className="mb-2 text-2xl font-semibold text-base-content">No campaigns yet</h3>
              <p className="mb-6 text-base-content/60">
                Create your first campaign to get started on your D&D adventures
              </p>
              <button
                onClick={() => router.push("/campaigns/new")}
                className="btn btn-primary gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block h-full group"
              >
                <div className="card bg-base-200 shadow-md h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-base-300">
                  <div className="card-body flex h-full flex-col p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-base-content leading-tight group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h3>
                      {campaign.dmId === session?.user?.id && (
                        <div className="badge badge-secondary badge-sm shrink-0">DM</div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="mt-auto pt-4 space-y-2 border-t border-base-300">
                      <div className="flex flex-wrap gap-2">
                        <div className="badge badge-outline gap-1.5">
                          <Users className="h-3 w-3" />
                          <span>{campaign._count.campaignCharacters}</span>
                        </div>
                        <div className="badge badge-outline gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{campaign._count.sessions}</span>
                        </div>
                      </div>

                      {campaign.dm && (
                        <p className="text-xs text-base-content/60 pt-1">
                          DM: <span className="font-medium">{campaign.dm.displayName ?? campaign.dm.name ?? campaign.dm.email}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
