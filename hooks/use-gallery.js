// lib/hooks/useGallery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();

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
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const fileExt = file.name.split(".").pop();

  const thumbnailPath = `${fileName}_thumb.jpg`;
  const fullPath = `${fileName}.${fileExt}`;

  const [thumbUpload, fullUpload] = await Promise.all([
    supabase.storage.from("gallery").upload(thumbnailPath, thumbnailFile, {
      cacheControl: "3600",
      upsert: false,
    }),
    supabase.storage.from("gallery").upload(fullPath, file, {
      cacheControl: "3600",
      upsert: false,
    }),
  ]);

  if (thumbUpload.error) throw thumbUpload.error;
  if (fullUpload.error) throw fullUpload.error;

  const { data: { publicUrl: thumbUrl } } = supabase.storage.from("gallery").getPublicUrl(thumbnailPath);
  const { data: { publicUrl: fullUrl } } = supabase.storage.from("gallery").getPublicUrl(fullPath);

  const { data, error: dbError } = await supabase
    .from("gallery")
    .insert({
      title,
      description,
      category,
      image_url: thumbUrl,
      full_image_url: fullUrl,
      storage_path: thumbnailPath,
      full_storage_path: fullPath,
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
  // Remove both storage files in parallel
  const pathsToRemove = [image.storage_path, image.full_storage_path].filter(Boolean);

  if (pathsToRemove.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("gallery")
      .remove(pathsToRemove);
    if (storageError) throw storageError;
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