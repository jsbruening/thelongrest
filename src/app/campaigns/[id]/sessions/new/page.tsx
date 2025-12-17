import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { CreateSessionForm } from "./_components/create-session-form";

export default async function NewSessionPage({
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

  if (campaign.dmId !== session.user.id) {
    redirect(`/campaigns/${id}`);
  }

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-4xl font-bold text-white">
            New Session - {campaign.name}
          </h1>
          <CreateSessionForm campaignId={id} />
        </div>
      </div>
    </HydrateClient>
  );
}

