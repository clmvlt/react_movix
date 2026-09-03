import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CalendarClock,
  CircleDot,
  KeyRound,
  PackageX,
  Route as RouteIcon,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  CommandExpDateDialog,
  type CommandActionTour,
} from "@/components/command-actions";
import {
  CommandKeyDialog,
  type CommandKeyPharmacy,
} from "@/components/commands/command-key-dialog";
import { CommandSouffranceDialog } from "@/components/commands/command-souffrance-dialog";
import { CommandStatusDialog } from "@/components/commands/command-status-dialog";
import { useCommandError } from "@/components/commands/use-command-error";
import { safeCategoryColor } from "@/lib/colors";
import { useToast } from "@/app/toast-context";
import { useAssignCommands, useUnassignCommands } from "@/features/commands";
import { tourKeys } from "@/features/tours";

interface CommandContextMenuProps {
  commandIds: string[];
  tours?: CommandActionTour[];
  pharmacy?: CommandKeyPharmacy | null;
  onDone?: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function CommandContextMenu({
  commandIds,
  tours = [],
  pharmacy = null,
  onDone,
  disabled = false,
  children,
}: CommandContextMenuProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const describeError = useCommandError();
  const assign = useAssignCommands();
  const unassign = useUnassignCommands();

  const [statusOpen, setStatusOpen] = useState(false);
  const [expDateOpen, setExpDateOpen] = useState(false);
  const [souffranceOpen, setSouffranceOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);

  if (disabled) return <>{children}</>;

  const pending = assign.isPending || unassign.isPending;
  const keyPharmacy = commandIds.length === 1 ? pharmacy : null;

  const done = () => {
    void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    onDone?.();
  };

  const fail = (cause: unknown) => toast.error(describeError(cause));

  const openDialog = (setter: (open: boolean) => void) => {
    window.setTimeout(() => setter(true), 0);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div>{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {commandIds.length > 1 && (
            <>
              <ContextMenuLabel>
                {t("expeditions.selected", { count: commandIds.length })}
              </ContextMenuLabel>
              <ContextMenuSeparator />
            </>
          )}
          {keyPharmacy && (
            <ContextMenuItem onSelect={() => openDialog(setKeyOpen)}>
              <KeyRound />
              {t("commands.editKey")}
            </ContextMenuItem>
          )}
          {keyPharmacy && <ContextMenuSeparator />}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <RouteIcon />
              {t("expeditions.assign")}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-72 w-52 overflow-y-auto">
              {tours.length === 0 ? (
                <ContextMenuItem disabled>
                  {t("expeditions.noTours")}
                </ContextMenuItem>
              ) : (
                tours.map((tour) => (
                  <ContextMenuItem
                    key={tour.id}
                    disabled={pending}
                    onSelect={() =>
                      assign.mutate(
                        { tourId: tour.id, commandIds },
                        { onSuccess: done, onError: fail }
                      )
                    }
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: safeCategoryColor(tour.color) }}
                    />
                    <span className="truncate">{tour.name}</span>
                  </ContextMenuItem>
                ))
              )}
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                disabled={pending}
                onSelect={() =>
                  unassign.mutate(
                    { commandIds },
                    { onSuccess: done, onError: fail }
                  )
                }
              >
                <Ban />
                {t("expeditions.unassign")}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onSelect={() => openDialog(setStatusOpen)}>
            <CircleDot />
            {t("expeditions.changeStatus")}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => openDialog(setExpDateOpen)}>
            <CalendarClock />
            {t("expeditions.changeExpDate")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => openDialog(setSouffranceOpen)}>
            <PackageX />
            {t("expeditions.souffrance")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <CommandStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        commandIds={commandIds}
        onDone={done}
      />
      <CommandExpDateDialog
        open={expDateOpen}
        onOpenChange={setExpDateOpen}
        commandIds={commandIds}
        onDone={done}
      />
      <CommandSouffranceDialog
        open={souffranceOpen}
        onOpenChange={setSouffranceOpen}
        commandIds={commandIds}
        onDone={done}
      />
      {keyPharmacy && (
        <CommandKeyDialog
          open={keyOpen}
          onOpenChange={setKeyOpen}
          pharmacy={keyPharmacy}
        />
      )}
    </>
  );
}
