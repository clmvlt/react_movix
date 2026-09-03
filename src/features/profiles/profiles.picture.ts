import { dataUrlBytes, fileToDataUrl } from "@/lib/images";
import {
  PROFIL_PICTURE_MAX_BYTES,
  PROFIL_PICTURE_MAX_EDGE,
  PROFIL_PICTURE_QUALITY,
} from "./types";

export async function toProfilPictureDataUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return fileToDataUrl(file);
  }

  const scale = Math.min(
    1,
    PROFIL_PICTURE_MAX_EDGE / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return fileToDataUrl(file);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", PROFIL_PICTURE_QUALITY);
}

export function profilPictureTooLarge(dataUrl: string): boolean {
  return dataUrlBytes(dataUrl) > PROFIL_PICTURE_MAX_BYTES;
}
