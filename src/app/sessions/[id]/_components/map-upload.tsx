"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface MapUploadProps {
  sessionId: string;
}

export function MapUpload({ sessionId }: MapUploadProps) {
  const [name, setName] = useState("");
  const [vttFile, setVttFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1000);
  const [gridSize, setGridSize] = useState(70);
  const [isUploading, setIsUploading] = useState(false);

  const utils = api.useUtils();
  const uploadMutation = api.map.upload.useMutation({
    onSuccess: () => {
      utils.map.getBySession.invalidate({ sessionId });
      setName("");
      setVttFile(null);
      setImageFile(null);
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  const handleFileChange = (file: File, type: "vtt" | "image") => {
    if (type === "vtt") {
      setVttFile(file);
    } else {
      setImageFile(file);
      // Try to get image dimensions
      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageFile) {
      alert("Please provide a name and image file");
      return;
    }

    setIsUploading(true);

    try {
      // Convert files to base64
      const vttBase64 = vttFile
        ? await fileToBase64(vttFile)
        : "";
      const imageBase64 = await fileToBase64(imageFile);

      uploadMutation.mutate({
        sessionId,
        name: name.trim(),
        vttFile: vttBase64,
        imageFile: imageBase64,
        imageFileName: imageFile.name,
        width,
        height,
        gridSize,
      });
    } catch (error) {
      console.error("Error uploading map:", error);
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64 ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="mapName" className="mb-2 block text-sm font-medium text-white">
          Map Name *
        </label>
        <input
          id="mapName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dungeon Level 1"
          required
          className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
        />
      </div>

      <div>
        <label htmlFor="mapImage" className="mb-2 block text-sm font-medium text-white">
          Map Image *
        </label>
        <input
          id="mapImage"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(file, "image");
          }}
          required
          className="w-full rounded bg-white/10 px-4 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-[hsl(280,100%,70%)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[hsl(280,100%,60%)]"
        />
      </div>

      <div>
        <label htmlFor="vttFile" className="mb-2 block text-sm font-medium text-white">
          VTT File (Optional)
        </label>
        <input
          id="vttFile"
          type="file"
          accept=".vtt,.dd2vtt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(file, "vtt");
          }}
          className="w-full rounded bg-white/10 px-4 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-[hsl(280,100%,70%)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[hsl(280,100%,60%)]"
        />
        <p className="mt-1 text-xs text-white/50">
          Universal VTT format file with walls and doors
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="mapWidth" className="mb-2 block text-sm font-medium text-white">
            Width (px)
          </label>
          <input
            id="mapWidth"
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            min="100"
            required
            className="w-full rounded bg-white/10 px-4 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="mapHeight" className="mb-2 block text-sm font-medium text-white">
            Height (px)
          </label>
          <input
            id="mapHeight"
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min="100"
            required
            className="w-full rounded bg-white/10 px-4 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="gridSize" className="mb-2 block text-sm font-medium text-white">
            Grid Size (px)
          </label>
          <input
            id="gridSize"
            type="number"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            min="10"
            max="200"
            required
            className="w-full rounded bg-white/10 px-4 py-2 text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isUploading || uploadMutation.isPending}
        className="w-full rounded bg-[hsl(280,100%,70%)] px-6 py-2 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:opacity-50"
      >
        {isUploading || uploadMutation.isPending ? "Uploading..." : "Upload Map"}
      </button>

      {uploadMutation.error && (
        <p className="text-sm text-red-400">
          {uploadMutation.error.message}
        </p>
      )}
    </form>
  );
}

