import { redirect } from "next/navigation";
import Link from "next/link";
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
  const map = gameSession.map
    ? await api.map.getBySession({ sessionId: id })
    : null;
  // Tokens will be fetched client-side via React Query

  // Ensure user is a participant
  const isDM = gameSession.campaign.dmId === session.user.id;
  const isParticipant = gameSession.participants.some(
    (p) => p.userId === session.user.id,
  );

  if (!isDM && !isParticipant) {
    // Try to join the session
    try {
      await api.session.join({ id });
    } catch (error) {
      // If join fails, redirect back to campaign
      redirect(`/campaigns/${gameSession.campaignId}`);
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

