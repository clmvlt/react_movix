import { dataUrlBytes, fileToDataUrl } from "@/lib/images";
import { LOGO_MAX_BYTES, LOGO_MAX_EDGE } from "./types";

export async function toLogoDataUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return fileToDataUrl(file);
  }

  const scale = Math.min(
    1,
    LOGO_MAX_EDGE / Math.max(bitmap.width, bitmap.height)
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

  return canvas.toDataURL("image/png");
}

export function logoTooLarge(dataUrl: string): boolean {
  return dataUrlBytes(dataUrl) > LOGO_MAX_BYTES;
}
