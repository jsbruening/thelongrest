import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { CharacterLibrary } from "./_components/character-library";

export default async function CharactersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <CharacterLibrary />
    </HydrateClient>
  );
}

