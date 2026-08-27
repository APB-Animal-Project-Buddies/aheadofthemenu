/**
 * Browser-side image upload to Nhost storage, shared by the creator photo and
 * gallery controls (same bucket + path DishGallery uses). Resolves to the
 * file's public URL. Throws with a user-facing message.
 */
import { getNhost, nhostFileUrl } from "@/lib/nhost/client";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`"${file.name}" is over 8 MB — please pick a smaller image.`);
  const up = await getNhost().storage.uploadFiles({ "bucket-id": "dish-media", "file[]": [file] });
  const fileId = up.body?.processedFiles?.[0]?.id;
  if (!fileId) throw new Error("The upload didn't return a file id — please try again.");
  return nhostFileUrl(fileId);
}
