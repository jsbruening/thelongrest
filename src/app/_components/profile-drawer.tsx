"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, X, Save, Info } from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(session?.user?.displayName ?? session?.user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image ?? "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, error: queryError } = api.user.getProfile.useQuery(undefined, {
    enabled: open && !!session?.user,
    retry: false,
  });

  // Sync form fields when profile data loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? profile.name ?? "");
      setAvatarUrl(profile.image ?? "");
    }
  }, [profile]);

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      await updateSession();
      router.refresh();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Failed to update profile");
    },
  });

  const handleSave = () => {
    setError("");
    updateProfileMutation.mutate({
      displayName: displayName.trim() || null,
      image: avatarUrl.trim() || null,
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const data = await response.json();
      setAvatarUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!open) return null;

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box glass-product w-full sm:w-[420px] max-w-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-base-content">Profile Settings</h2>
          <form method="dialog">
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : queryError ? (
          <div className="flex flex-1 flex-col gap-3">
            <div className="alert alert-error">
              <span>{queryError.message || "Failed to load profile"}</span>
            </div>
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-6">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
                <button onClick={() => setError("")} className="btn btn-sm btn-ghost">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="avatar">
                  <div className="w-32 rounded-full ring ring-primary/20 ring-offset-4 ring-offset-base-100">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName || "User"} />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-4xl font-semibold">
                        {displayName?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
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
                  disabled={uploading}
                  className="btn btn-circle btn-sm absolute bottom-0 right-0"
                >
                  {uploading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-base-content/60 text-center">
                Click the camera icon to upload an avatar
              </p>
            </div>

            {/* Display Name */}
            <div className="form-control">
              <label className="label" htmlFor="displayName">
                <span className="label-text font-medium">Display Name</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="input input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  This is how other players will see your name
                </span>
              </label>
            </div>

            {/* Info */}
            <div className="alert shadow-sm">
              <Info className="h-4 w-4" />
              <span className="text-xs">
                Your display name and avatar will be visible to other players in campaigns and sessions.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={updateProfileMutation.isPending}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="btn btn-primary flex-1 gap-2"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
