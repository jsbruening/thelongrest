import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { CampaignsPage as CampaignsPageClient } from "./_components/campaigns-page";

export default async function CampaignsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <CampaignsPageClient />
    </HydrateClient>
  );
}


