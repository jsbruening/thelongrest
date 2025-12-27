import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SessionView } from "./_components/session-view";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch session data
  const gameSession = await api.session.getById({ id });
  const map = await api.map.getBySession({ sessionId: id }).catch(() => null);
  // Tokens will be fetched client-side via React Query

  // Fetch campaign to check DM status
  const campaign = await api.campaign.getById({ id: gameSession.campaignId });
  const isDM = campaign.dmId === session.user.id;
  // Check if user has characters in the campaign (participant check)
  const isParticipant = campaign.campaignCharacters.some(
    (cc) => cc.character.userId === session.user.id,
  );

  if (!isDM && !isParticipant) {
    // Try to join the session
    try {
      await api.session.join({ id });
    } catch {
      // If join fails, redirect back to campaign
      redirect(`/campaigns/${campaign.id}`);
    }
  }

  return (
    <HydrateClient>
      <SessionView
        session={gameSession}
        map={map}
        isDM={isDM}
        userId={session.user.id}
      />
    </HydrateClient>
  );
}

