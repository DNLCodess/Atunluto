// lib/hooks/useGallery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();

async function cloudinaryUpload(file, { signature, timestamp, folder, cloudName, apiKey }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Image upload failed.");
  return res.json();
}

export const GALLERY_QUERY_KEY = ["gallery"];

const GALLERY_FIELDS = [
  "id",
  "title",
  "description",
  "category",
  "image_url",
  "full_image_url",
  "storage_path",
  "full_storage_path",
  "uploaded_by",
  "created_at",
].join(", ");

async function fetchGallery() {
  const { data, error } = await supabase
    .from("gallery")
    .select(GALLERY_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function uploadImageFn({ file, thumbnailFile, title, description, category, userId }) {
  const signRes = await fetch("/api/cloudinary-sign?folder=gallery");
  if (!signRes.ok) throw new Error("Failed to get upload credentials.");
  const signParams = await signRes.json();

  const [thumbResult, fullResult] = await Promise.all([
    cloudinaryUpload(thumbnailFile, signParams),
    cloudinaryUpload(file, signParams),
  ]);

  const { data, error: dbError } = await supabase
    .from("gallery")
    .insert({
      title,
      description,
      category,
      image_url: thumbResult.secure_url,
      full_image_url: fullResult.secure_url,
      storage_path: thumbResult.public_id,
      full_storage_path: fullResult.public_id,
      uploaded_by: userId,
    })
    .select(GALLERY_FIELDS)
    .single();

  if (dbError) throw dbError;
  return data;
}

async function updateImageFn({ id, title, description, category }) {
  const { data, error } = await supabase
    .from("gallery")
    .update({ title, description, category })
    .eq("id", id)
    .select(GALLERY_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

async function deleteImageFn(image) {
  const isVideo = image.media_type === "video";
  const assets = [
    image.storage_path && {
      publicId: image.storage_path,
      resourceType: isVideo ? "video" : "image",
    },
    image.full_storage_path && {
      publicId: image.full_storage_path,
      resourceType: "image",
    },
  ].filter(Boolean);

  if (assets.length > 0) {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete media from storage.");
    }
  }

  const { error: dbError } = await supabase
    .from("gallery")
    .delete()
    .eq("id", image.id);

  if (dbError) throw dbError;
  return image.id;
}

export function useGallery() {
  const queryClient = useQueryClient();

  const { data: images = [], isLoading, error } = useQuery({
    queryKey: GALLERY_QUERY_KEY,
    queryFn: fetchGallery,
    staleTime: 2 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadImageFn,
    onSuccess: (newImage) => {
      queryClient.setQueryData(GALLERY_QUERY_KEY, (old = []) => [newImage, ...old]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateImageFn,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: GALLERY_QUERY_KEY });
      const previous = queryClient.getQueryData(GALLERY_QUERY_KEY);
      queryClient.setQueryData(GALLERY_QUERY_KEY, (old = []) =>
        old.map((img) => (img.id === vars.id ? { ...img, ...vars } : img))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(GALLERY_QUERY_KEY, ctx.previous);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(GALLERY_QUERY_KEY, (old = []) =>
        old.map((img) => (img.id === updated.id ? updated : img))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImageFn,
    onMutate: async (image) => {
      await queryClient.cancelQueries({ queryKey: GALLERY_QUERY_KEY });
      const previous = queryClient.getQueryData(GALLERY_QUERY_KEY);
      queryClient.setQueryData(GALLERY_QUERY_KEY, (old = []) =>
        old.filter((img) => img.id !== image.id)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(GALLERY_QUERY_KEY, ctx.previous);
    },
  });

  return {
    images,
    isLoading,
    fetchError: error?.message ?? null,

    uploadImage: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error?.message ?? null,
    uploadReset: uploadMutation.reset,

    updateImage: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteImage: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
}