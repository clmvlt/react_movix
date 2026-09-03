import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { useTokenError } from "@/components/api-tokens/use-token-error";
import {
  useDeleteImporterToken,
  type ImporterToken,
} from "@/features/importer-tokens";

interface TokenDeleteDialogProps {
  token: ImporterToken | null;
  onOpenChange: (open: boolean) => void;
}

export function TokenDeleteDialog({
  token,
  onOpenChange,
}: TokenDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteToken = useDeleteImporterToken();
  const errorMessage = useTokenError();
  const toast = useToast();
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!token) return;
    setConfirmation("");
  }, [token]);

  const matches = Boolean(token) && confirmation.trim() === token?.name.trim();

  const handleDelete = () => {
    if (!token || !matches) return;
    deleteToken.mutate(token.id, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        toast.error(errorMessage(err, "apiTokens.errors.deleteFailed")),
    });
  };

  return (
    <Dialog open={Boolean(token)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("apiTokens.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("apiTokens.delete.confirm", { name: token?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="warning">
          <AlertDescription>{t("apiTokens.delete.warning")}</AlertDescription>
        </Alert>

        <FormField
          label={t("apiTokens.delete.typeName", { name: token?.name ?? "" })}
          htmlFor="token-delete-confirm"
        >
          <Input
            id="token-delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => onOpenChange(false)}
            disabled={deleteToken.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 sm:min-h-10"
            onClick={handleDelete}
            disabled={!matches || deleteToken.isPending}
          >
            {deleteToken.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
