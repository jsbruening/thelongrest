"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface CreateCharacterFormProps {
  campaignId: string;
  isDM: boolean;
}

export function CreateCharacterForm({
  campaignId,
  isDM,
}: CreateCharacterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [race, setRace] = useState("");
  const [characterClass, setCharacterClass] = useState("");
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const { data: campaignUsers } = api.user.getCampaignUsers.useQuery(
    { campaignId },
    { enabled: isDM },
  );

  const createCharacterMutation = api.character.create.useMutation({
    onSuccess: () => {
      router.push(`/campaigns/${campaignId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !race.trim() || !characterClass.trim()) return;

    createCharacterMutation.mutate({
      campaignId,
      name: name.trim(),
      level,
      race: race.trim(),
      class: characterClass.trim(),
      userId: isDM ? userId : undefined,
    });
  };

  const commonRaces = [
    "Human",
    "Elf",
    "Dwarf",
    "Halfling",
    "Dragonborn",
    "Gnome",
    "Half-Elf",
    "Half-Orc",
    "Tiefling",
  ];

  const commonClasses = [
    "Barbarian",
    "Bard",
    "Cleric",
    "Druid",
    "Fighter",
    "Monk",
    "Paladin",
    "Ranger",
    "Rogue",
    "Sorcerer",
    "Warlock",
    "Wizard",
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-white">
          Character Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aragorn"
          required
          className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
        />
      </div>

      {isDM && campaignUsers && (
        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Assign to Player (Optional)
          </label>
          <select
            value={userId ?? ""}
            onChange={(e) => setUserId(e.target.value || undefined)}
            className="w-full rounded bg-white/10 px-4 py-2 text-white"
          >
            <option value="">Unassigned</option>
            {campaignUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Level *
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            required
            className="w-full rounded bg-white/10 px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Race *
          </label>
          <input
            type="text"
            list="races"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            placeholder="Human"
            required
            className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
          />
          <datalist id="races">
            {commonRaces.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Class *
          </label>
          <input
            type="text"
            list="classes"
            value={characterClass}
            onChange={(e) => setCharacterClass(e.target.value)}
            placeholder="Fighter"
            required
            className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
          />
          <datalist id="classes">
            {commonClasses.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={createCharacterMutation.isPending}
          className="rounded bg-[hsl(280,100%,70%)] px-6 py-2 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:opacity-50"
        >
          {createCharacterMutation.isPending ? "Creating..." : "Create Character"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded bg-white/10 px-6 py-2 text-white transition hover:bg-white/20"
        >
          Cancel
        </button>
      </div>

      {createCharacterMutation.error && (
        <p className="text-sm text-red-400">
          {createCharacterMutation.error.message}
        </p>
      )}
    </form>
  );
}

