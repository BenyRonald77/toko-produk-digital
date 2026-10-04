import { createHmac, randomBytes } from "crypto";
import path from "path";

export const STORAGE_DIR = path.join(process.cwd(), "storage", "products");

const downloadSecret = () =>
  process.env.DOWNLOAD_SECRET || "dev-secret-minimal-32-karakter-ganti";

export const downloadExpiryHours = () =>
  parseInt(process.env.DOWNLOAD_EXPIRY_HOURS || "24", 10);

export const downloadMaxUses = () =>
  parseInt(process.env.DOWNLOAD_MAX_USES || "5", 10);

/** License key unik: XXXX-XXXX-XXXX-XXXX (huruf besar + angka, tanpa karakter ambigu). */
export function generateLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chunk = () =>
    Array.from({ length: 4 }, () => alphabet[randomBytes(1)[0] % alphabet.length]).join(
      ""
    );
  return `${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
}

function signPayload(payload: string): string {
  return createHmac("sha256", downloadSecret()).update(payload).digest("hex");
}

/** Buat token unduhan bertanda tangan. */
export function buildDownloadToken(
  purchaseId: number,
  versionId: number,
  expEpochSec?: number
): { exp: number; sig: string } {
  const exp =
    expEpochSec ?? Math.floor(Date.now() / 1000) + downloadExpiryHours() * 3600;
  const payload = `${purchaseId}.${versionId}.${exp}`;
  return { exp, sig: signPayload(payload) };
}

export function downloadUrl(
  base: string,
  purchaseId: number,
  versionId: number,
  expEpochSec?: number
): string {
  const { exp, sig } = buildDownloadToken(purchaseId, versionId, expEpochSec);
  return `${base}/api/download?p=${purchaseId}&v=${versionId}&exp=${exp}&sig=${sig}`;
}

/** Verifikasi signature link unduhan. Return null jika tidak valid. */
export function verifyDownloadToken(
  p: string,
  v: string,
  exp: string,
  sig: string
): { purchaseId: number; versionId: number } | null {
  const purchaseId = parseInt(p, 10);
  const versionId = parseInt(v, 10);
  const expSec = parseInt(exp, 10);
  if (!Number.isInteger(purchaseId) || !Number.isInteger(versionId) || !Number.isInteger(expSec))
    return null;
  if (expSec * 1000 < Date.now()) return null; // kedaluwarsa
  const payload = `${purchaseId}.${versionId}.${expSec}`;
  const expected = signPayload(payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  return { purchaseId, versionId };
}
