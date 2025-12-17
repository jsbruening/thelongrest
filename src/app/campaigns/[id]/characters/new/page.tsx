import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { CreateCharacterForm } from "./_components/create-character-form";

export default async function NewCharacterPage({
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

  // Check access
  const hasAccess =
    campaign.dmId === session.user.id ||
    campaign.campaignCharacters.some((cc) => cc.character.userId === session.user.id);

  if (!hasAccess) {
    redirect(`/campaigns/${id}`);
  }

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-4xl font-bold text-white">
            New Character - {campaign.name}
          </h1>
          <CreateCharacterForm campaignId={id} isDM={campaign.dmId === session.user.id} />
        </div>
      </div>
    </HydrateClient>
  );
}

