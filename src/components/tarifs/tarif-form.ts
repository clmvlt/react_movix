import {
  TARIF_KM_MAX,
  TARIF_PRICE_MAX,
  type Tarif,
  type TarifInput,
} from "@/features/tarifs";

export interface TarifFormState {
  kmMax: string;
  prixEuro: string;
}

export function initialTarifForm(tarif: Tarif | null): TarifFormState {
  return {
    kmMax: tarif ? String(tarif.kmMax) : "",
    prixEuro: tarif ? String(tarif.prixEuro) : "",
  };
}

export function parseDecimal(value: string): number | null {
  const raw = value.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildTarifPayload(form: TarifFormState): TarifInput {
  return {
    kmMax: parseDecimal(form.kmMax) ?? 0,
    prixEuro: parseDecimal(form.prixEuro) ?? 0,
  };
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function validateTarifForm(
  form: TarifFormState,
  existing: Tarif[],
  editingId: string | null,
  t: Translate
): Record<string, string> {
  const errors: Record<string, string> = {};

  const kmMax = parseDecimal(form.kmMax);
  if (!form.kmMax.trim()) {
    errors.kmMax = t("tarifs.form.errors.kmMaxRequired");
  } else if (kmMax == null) {
    errors.kmMax = t("tarifs.form.errors.number");
  } else if (kmMax < 0 || kmMax > TARIF_KM_MAX) {
    errors.kmMax = t("tarifs.form.errors.kmMaxRange", { max: TARIF_KM_MAX });
  } else if (
    existing.some((tarif) => tarif.id !== editingId && tarif.kmMax === kmMax)
  ) {
    errors.kmMax = t("tarifs.form.errors.duplicate");
  }

  const price = parseDecimal(form.prixEuro);
  if (!form.prixEuro.trim()) {
    errors.prixEuro = t("tarifs.form.errors.priceRequired");
  } else if (price == null) {
    errors.prixEuro = t("tarifs.form.errors.number");
  } else if (price < 0 || price > TARIF_PRICE_MAX) {
    errors.prixEuro = t("tarifs.form.errors.priceRange", {
      max: TARIF_PRICE_MAX,
    });
  } else if (Math.round(price * 100) !== price * 100) {
    errors.prixEuro = t("tarifs.form.errors.decimals");
  }

  return errors;
}

export function hasPriceInversion(tarifs: Tarif[]): boolean {
  for (let index = 1; index < tarifs.length; index += 1) {
    if (tarifs[index].prixEuro < tarifs[index - 1].prixEuro) return true;
  }
  return false;
}
