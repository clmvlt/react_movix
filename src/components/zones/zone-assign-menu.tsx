import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderInput, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { unassignedColor } from "@/lib/colors";
import { useAssignClientsToZone } from "@/features/clients";
import type { Zone } from "@/features/zones";

export interface ZoneNotice {
  variant: "success" | "warning" | "destructive";
  message: string;
}

interface ZoneAssignMenuProps {
  clientIds: string[];
  zones: Zone[];
  colors: Record<string, string>;
  layout?: "inline" | "bar";
  onResult: (notice: ZoneNotice) => void;
  onDone: () => void;
}

export function ZoneAssignMenu({
  clientIds,
  zones,
  colors,
  layout = "inline",
  onResult,
  onDone,
}: ZoneAssignMenuProps) {
  const { t } = useTranslation();
  const assign = useAssignClientsToZone();
  const [open, setOpen] = useState(false);

  const pending = assign.isPending;
  const isBar = layout === "bar";

  const close = () => {
    setOpen(false);
    onDone();
  };

  const handleAssign = (zone: Zone) => {
    assign.mutate(
      { clientIds, zoneId: zone.id },
      {
        onSuccess: (result) => {
          onResult({
            variant: "success",
            message: t("zones.assign.success", {
              count: result.updated,
              zone: zone.name,
            }),
          });
          close();
        },
        onError: () =>
          onResult({
            variant: "destructive",
            message: t("zones.assign.failed"),
          }),
      }
    );
  };

  const handleDetach = () => {
    assign.mutate(
      { clientIds, zoneId: null },
      {
        onSuccess: (result) => {
          onResult({
            variant: "success",
            message: t("zones.assign.detachSuccess", { count: result.updated }),
          });
          close();
        },
        onError: () =>
          onResult({
            variant: "destructive",
            message: t("zones.assign.failed"),
          }),
      }
    );
  };

  return (
    <>
      <Button
        variant={isBar ? "default" : "outline"}
        size={isBar ? "default" : "sm"}
        disabled={clientIds.length === 0}
        className={cn(isBar && "min-h-11 shrink-0")}
        onClick={() => setOpen(true)}
      >
        <FolderInput className="size-4" />
        {isBar ? t("zones.assign.actionShort") : t("zones.assign.action")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("zones.assign.action")}</DialogTitle>
            <DialogDescription>
              {t("zones.assign.menuLabel", { count: clientIds.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {zones.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                {t("zones.empty")}
              </p>
            ) : (
              zones.map((zone) => (
                <Button
                  key={zone.id}
                  variant="outline"
                  className="min-h-11 shrink-0 justify-start gap-2.5 px-3 lg:min-h-10"
                  disabled={pending}
                  onClick={() => handleAssign(zone)}
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        colors[zone.id.toLowerCase()] ?? unassignedColor,
                    }}
                  />
                  <span className="truncate">
                    {zone.name?.trim() || t("zones.untitled")}
                  </span>
                </Button>
              ))
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              className="min-h-11 text-destructive lg:min-h-10"
              disabled={pending}
              onClick={handleDetach}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              {t("zones.assign.detach")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
