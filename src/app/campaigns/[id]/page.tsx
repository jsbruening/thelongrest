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
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container mx-auto max-w-7xl px-8 lg:px-12 py-8">
          <Link
            href="/campaigns"
            className="mb-4 inline-block text-white/60 hover:text-white"
          >
            ← Back to Campaigns
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white">{campaign.name}</h1>
            {campaign.description && (
              <p className="mt-2 text-white/70">{campaign.description}</p>
            )}
            <p className="mt-2 text-sm text-white/60">
              DM: {campaign.dm.displayName ?? campaign.dm.name ?? campaign.dm.email}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Sessions */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Game Sessions</h2>
                  <p className="text-sm text-white/60 mt-1">Manage your campaign sessions</p>
                </div>
                {campaign.dmId === session.user.id && (
                  <Link
                    href={`/campaigns/${id}/sessions/new`}
                    className="btn btn-primary btn-sm whitespace-nowrap"
                  >
                    New Session
                  </Link>
                )}
              </div>

              {campaign.sessions.length === 0 ? (
                <div className="rounded-lg bg-white/10 p-4 text-center text-white/60">
                  No sessions yet
                </div>
              ) : (
                <div className="space-y-2">
                  {campaign.sessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="block rounded-lg bg-white/10 p-4 transition hover:bg-white/20"
                    >
                      <h3 className="font-semibold text-white">
                        {session.name}
                      </h3>
                      <p className="text-sm text-white/60">
                        Status: {session.status}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Characters */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Campaign Characters</h2>
                  <p className="text-sm text-white/60 mt-1">Characters linked to this campaign</p>
                </div>
                <Link
                  href={`/campaigns/${id}/characters/new`}
                  className="btn btn-primary btn-sm whitespace-nowrap"
                >
                  Link Character
                </Link>
              </div>

              {campaign.campaignCharacters.length === 0 ? (
                <div className="rounded-lg bg-white/10 p-4 text-center text-white/60">
                  No characters yet
                </div>
              ) : (
                <div className="space-y-2">
                  {campaign.campaignCharacters.map((cc) => (
                    <div
                      key={cc.id}
                      className="rounded-lg bg-white/10 p-4"
                    >
                      <h3 className="font-semibold text-white">
                        {cc.character.name}
                      </h3>
                      <p className="text-sm text-white/60">
                        Level {cc.level} {cc.character.race}{" "}
                        {cc.character.class}
                      </p>
                      {cc.character.user && (
                        <p className="text-xs text-white/50">
                          Player: {cc.character.user.displayName ?? cc.character.user.name ?? cc.character.user.email}
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
    </HydrateClient>
  );
}


