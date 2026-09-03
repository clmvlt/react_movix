import { dataUrlBytes, fileToDataUrl } from "@/lib/images";
import {
  PICTURE_MAX_EDGE,
  PICTURE_PASSTHROUGH_BYTES,
  PICTURE_QUALITY,
} from "./types";

export { dataUrlBytes, fileToDataUrl };

export async function toUploadDataUrl(file: File): Promise<string> {
  if (file.size <= PICTURE_PASSTHROUGH_BYTES) {
    return fileToDataUrl(file);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return fileToDataUrl(file);
  }

  const scale = Math.min(
    1,
    PICTURE_MAX_EDGE / Math.max(bitmap.width, bitmap.height)
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

  return canvas.toDataURL("image/jpeg", PICTURE_QUALITY);
}

export function sortPictures<T extends { displayOrder: number | null }>(
  pictures: T[]
): T[] {
  return [...pictures].sort((a, b) => {
    if (a.displayOrder == null && b.displayOrder == null) return 0;
    if (a.displayOrder == null) return 1;
    if (b.displayOrder == null) return -1;
    return a.displayOrder - b.displayOrder;
  });
}
