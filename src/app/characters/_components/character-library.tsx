"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PhotoCamera, Plus, Edit, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";

export function CharacterLibrary() {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const { data: characters, isLoading, error } = api.character.getAll.useQuery();
  const utils = api.useUtils();

  const createMutation = api.character.create.useMutation({
    onSuccess: () => {
      utils.character.getAll.invalidate();
      setCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.character.update.useMutation({
    onSuccess: () => {
      utils.character.getAll.invalidate();
      setEditDialogOpen(false);
      setSelectedCharacter(null);
      resetForm();
    },
  });

  const deleteMutation = api.character.delete.useMutation({
    onSuccess: () => {
      utils.character.getAll.invalidate();
      setDeleteDialogOpen(false);
      setSelectedCharacter(null);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    race: "",
    class: "",
    avatarUrl: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      name: "",
      race: "",
      class: "",
      avatarUrl: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/character-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, avatarUrl: data.url }));
    } catch (err) {
      console.error("Error uploading avatar:", err);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      race: formData.race,
      class: formData.class,
      avatarUrl: formData.avatarUrl || undefined,
    });
  };

  const handleEdit = (characterId: string) => {
    const character = characters?.find((c) => c.id === characterId);
    if (character) {
      setFormData({
        name: character.name,
        race: character.race,
        class: character.class,
        avatarUrl: character.avatarUrl ?? "",
      });
      setSelectedCharacter(characterId);
      setEditDialogOpen(true);
    }
  };

  const handleUpdate = () => {
    if (!selectedCharacter) return;
    updateMutation.mutate({
      id: selectedCharacter,
      name: formData.name,
      race: formData.race,
      class: formData.class,
      avatarUrl: formData.avatarUrl || null,
    });
  };

  const handleDelete = (characterId: string) => {
    setSelectedCharacter(characterId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedCharacter) return;
    deleteMutation.mutate({ id: selectedCharacter });
  };

  // D&D 5e 2024 Player's Handbook Species (formerly Races)
  const commonRaces = [
    "Aasimar",
    "Dragonborn",
    "Dwarf",
    "Elf",
    "Gnome",
    "Goliath",
    "Halfling",
    "Human",
    "Orc",
    "Tiefling",
  ];

  // D&D 5e 2024 Player's Handbook Classes
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

  const CharacterForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="flex flex-col gap-4">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.name || "Character"} />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-3xl font-semibold">
                  {formData.name[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={handleFileSelect}
            disabled={uploadingAvatar}
            className="btn btn-circle btn-sm absolute bottom-0 right-0"
          >
            {uploadingAvatar ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <PhotoCamera className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-base-content/60 text-center">
          Click the camera icon to upload an avatar
        </p>
      </div>

      {/* Character Name */}
      <div className="form-control">
        <label className="label" htmlFor="name">
          <span className="label-text">Character Name</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="input input-bordered w-full"
        />
      </div>

      {/* Race and Class */}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label" htmlFor="race">
            <span className="label-text">Race</span>
          </label>
          <select
            id="race"
            value={formData.race}
            onChange={(e) => setFormData({ ...formData, race: e.target.value })}
            className="select select-bordered w-full"
          >
            <option value="">Select race</option>
            {commonRaces.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label className="label" htmlFor="class">
            <span className="label-text">Class</span>
          </label>
          <select
            id="class"
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            className="select select-bordered w-full"
          >
            <option value="">Select class</option>
            {commonClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(isEdit ? updateMutation.error : createMutation.error) && (
        <div className="alert alert-error">
          <span>{isEdit ? updateMutation.error?.message : createMutation.error?.message}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Characters</h1>
        <button
          onClick={() => {
            resetForm();
            setCreateDialogOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Create Character
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error.message || "Failed to load characters"}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !characters || characters.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body py-16 text-center">
            <h3 className="mb-2 text-lg font-semibold text-base-content/60">No characters yet</h3>
            <p className="mb-6 text-sm text-base-content/60">Create your first character to get started!</p>
            <button
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              Create Character
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <div
              key={character.id}
              className="card bg-base-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="card-body pt-6">
                <div className="flex items-center gap-4">
                  <div className="avatar">
                    <div className="w-16 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                      {character.avatarUrl ? (
                        <img src={character.avatarUrl} alt={character.name} />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-xl font-semibold">
                          {character.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold leading-none">{character.name}</h3>
                    <p className="mt-1 text-sm text-base-content/60">
                      {character.race} {character.class}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end p-4">
                <button
                  onClick={() => handleEdit(character.id)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(character.id)}
                  className="btn btn-ghost btn-sm btn-circle text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <dialog className={`modal ${createDialogOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-2">Create New Character</h3>
          <p className="text-sm text-base-content/60 mb-4">Add a new character to your library</p>
          <CharacterForm />
          <div className="modal-action">
            <form method="dialog">
              <button onClick={() => setCreateDialogOpen(false)} className="btn btn-outline mr-2">
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                disabled={!formData.name || !formData.race || !formData.class || createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={() => setCreateDialogOpen(false)}>
          <button>close</button>
        </form>
      </dialog>

      {/* Edit Modal */}
      <dialog className={`modal ${editDialogOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-2">Edit Character</h3>
          <p className="text-sm text-base-content/60 mb-4">Update your character's details</p>
          <CharacterForm isEdit />
          <div className="modal-action">
            <form method="dialog">
              <button onClick={() => setEditDialogOpen(false)} className="btn btn-outline mr-2">
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleUpdate();
                }}
                disabled={!formData.name || !formData.race || !formData.class || updateMutation.isPending}
                className="btn btn-primary"
              >
                {updateMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={() => setEditDialogOpen(false)}>
          <button>close</button>
        </form>
      </dialog>

      {/* Delete Modal */}
      <dialog className={`modal ${deleteDialogOpen ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Delete Character</h3>
          <p className="text-sm text-base-content/60 mb-4">
            Are you sure you want to delete this character? This action cannot be undone.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button onClick={() => setDeleteDialogOpen(false)} className="btn btn-outline mr-2">
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                disabled={deleteMutation.isPending}
                className="btn btn-error"
              >
                {deleteMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={() => setDeleteDialogOpen(false)}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
