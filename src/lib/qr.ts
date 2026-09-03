import qrcode from "qrcode-generator";

export interface QrMatrix {
  modules: number;
  path: string;
}

export const QR_QUIET_ZONE = 4;

export function buildQrMatrix(value: string): QrMatrix | null {
  const text = value.trim();
  if (!text) return null;

  try {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();

    const modules = qr.getModuleCount();
    const parts: string[] = [];
    for (let row = 0; row < modules; row += 1) {
      for (let col = 0; col < modules; col += 1) {
        if (qr.isDark(row, col)) parts.push(`M${col} ${row}h1v1h-1z`);
      }
    }

    return { modules, path: parts.join("") };
  } catch {
    return null;
  }
}
