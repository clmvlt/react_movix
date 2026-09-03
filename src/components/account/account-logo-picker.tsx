import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/app/toast-context";
import { imageUrl } from "@/lib/images";
import {
  LOGO_INPUT_MAX_BYTES,
  logoTooLarge,
  toLogoDataUrl,
} from "@/features/account";
import type { LogoDraft } from "./account-form";

interface AccountLogoPickerProps {
  value: LogoDraft;
  currentUrl?: string;
  onChange: (draft: LogoDraft) => void;
  disabled?: boolean;
}

export function AccountLogoPicker({
  value,
  currentUrl,
  onChange,
  disabled = false,
}: AccountLogoPickerProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const preview =
    value.kind === "replace"
      ? value.dataUrl
      : value.kind === "delete"
        ? null
        : (imageUrl(currentUrl) ?? null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("account.form.errors.logoNotImage"));
      return;
    }
    if (file.size > LOGO_INPUT_MAX_BYTES) {
      toast.error(t("account.form.errors.logoTooLarge"));
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await toLogoDataUrl(file);
      if (logoTooLarge(dataUrl)) {
        toast.error(t("account.form.errors.logoTooLarge"));
        return;
      }
      onChange({ kind: "replace", dataUrl, name: file.name });
    } catch {
      toast.error(t("account.form.errors.logoNotImage"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {preview ? (
            <img
              src={preview}
              alt={t("account.logo.preview")}
              className="size-full object-contain"
            />
          ) : (
            <ImageOff className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full lg:min-h-10 lg:w-auto"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("account.logo.change")}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full text-destructive lg:min-h-10 lg:w-auto"
              disabled={disabled || busy}
              onClick={() => onChange({ kind: "delete" })}
            >
              {t("account.logo.remove")}
            </Button>
          )}
          {value.kind !== "keep" && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 w-full lg:w-auto"
              disabled={disabled || busy}
              onClick={() => onChange({ kind: "keep" })}
            >
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <p className="text-xs leading-4 text-muted-foreground">
        {t("account.logo.hint")}
      </p>
    </div>
  );
}
