import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const campaign = await api.campaign.getById({ id });

  return (
    <HydrateClient>
      <div className="min-h-screen px-4 py-6 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/campaigns"
            className="mb-4 inline-block text-sm text-base-content/60 hover:text-base-content"
          >
            ← Back to Campaigns
          </Link>

          <div className="card bg-base-100 shadow-xl border border-base-300/60 mb-6">
            <div className="card-body">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-base-content">
                    {campaign.name}
                  </h1>
                  {campaign.description && (
                    <p className="mt-1 text-base-content/70">{campaign.description}</p>
                  )}
                  <p className="mt-2 text-sm text-base-content/60">
                    DM:{" "}
                    <span className="font-medium">
                      {campaign.dm.displayName ?? campaign.dm.name ?? campaign.dm.email}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sessions */}
            <div className="card bg-base-100 shadow-lg border border-base-300/60">
              <div className="card-body">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="card-title text-lg">Game Sessions</h2>
                    <p className="text-xs text-base-content/60">
                      Manage and launch play sessions for this campaign.
                    </p>
                  </div>
                  {campaign.dmId === session.user.id && (
                  <Link
                    href={`/campaigns/${id}/sessions/new`}
                      className="app-btn app-btn-primary whitespace-nowrap gap-2"
                  >
                      New Session
                    </Link>
                  )}
                </div>

                {campaign.sessions.length === 0 ? (
                  <div className="rounded-box border border-dashed border-base-300/70 p-4 text-center text-sm text-base-content/60">
                    No sessions yet. Create one to start playing.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaign.sessions.map((sessionItem) => (
                      <Link
                        key={sessionItem.id}
                        href={`/sessions/${sessionItem.id}`}
                        className="block rounded-box border border-base-300/70 bg-base-100 p-4 text-sm transition hover:border-primary/40 hover:bg-base-200/60"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-base-content">
                              {sessionItem.name}
                            </p>
                            <p className="text-xs text-base-content/60 mt-0.5">
                              Status: {sessionItem.status}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Characters */}
            <div className="card bg-base-100 shadow-lg border border-base-300/60">
              <div className="card-body">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="card-title text-lg">Campaign Characters</h2>
                    <p className="text-xs text-base-content/60">
                      Characters linked to this campaign.
                    </p>
                  </div>
                  <Link
                    href={`/campaigns/${id}/characters/new`}
                  className="app-btn app-btn-secondary whitespace-nowrap gap-2"
                  >
                    Link Character
                  </Link>
                </div>

                {campaign.campaignCharacters.length === 0 ? (
                  <div className="rounded-box border border-dashed border-base-300/70 p-4 text-center text-sm text-base-content/60">
                    No characters linked yet. Link characters to include them in sessions.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaign.campaignCharacters.map((cc) => (
                      <div
                        key={cc.id}
                        className="rounded-box border border-base-300/70 bg-base-100 p-4 text-sm"
                      >
                        <p className="font-semibold text-base-content">
                          {cc.character.name}
                        </p>
                        <p className="text-xs text-base-content/60 mt-0.5">
                          Level {cc.level} {cc.character.race} {cc.character.class}
                        </p>
                        {cc.character.user && (
                          <p className="text-[11px] text-base-content/50 mt-0.5">
                            Player:{" "}
                            {cc.character.user.displayName ??
                              cc.character.user.name ??
                              cc.character.user.email}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}


