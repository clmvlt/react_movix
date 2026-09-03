import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DiscardGuardOptions {
  dirty: boolean;
  onLeave: () => void;
}

interface DiscardGuard {
  requestLeave: () => void;
  dialog: ReactNode;
}

export function useDiscardGuard({ dirty, onLeave }: DiscardGuardOptions): DiscardGuard {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const requestLeave = () => {
    if (dirty) setOpen(true);
    else onLeave();
  };

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("common.unsavedDialog.title")}</DialogTitle>
          <DialogDescription>{t("common.unsavedDialog.message")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => setOpen(false)}
          >
            {t("common.unsavedDialog.stay")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 sm:min-h-10"
            onClick={() => {
              setOpen(false);
              onLeave();
            }}
          >
            {t("common.unsavedDialog.leave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { requestLeave, dialog };
}
