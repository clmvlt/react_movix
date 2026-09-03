import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CircleDot,
  FileDown,
  History,
  ReceiptEuro,
  Trash2,
  UserPlus,
  Wand2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ColorDot } from "@/components/color-dot";
import { DeleteTourDialog } from "@/components/tours/delete-tour-dialog";
import { TourAssignDialog } from "@/components/tours/tour-assign-dialog";
import { TourHistoryDialog } from "@/components/tours/tour-history-dialog";
import { TourStatusDialog } from "@/components/tours/tour-status-dialog";
import { pdfErrorKey } from "@/components/tours/tour-form";
import { useAuth } from "@/app/auth-context";
import { usePdfPreview } from "@/app/pdf-preview-context";
import type { Profil } from "@/features/auth";
import {
  canDownloadTourPdf,
  isTourClosed,
  tourPdfFilename,
  tourPdfService,
  useDeleteTour,
  type Tour,
  type TourPdfKind,
} from "@/features/tours";

interface TourContextMenuProps {
  tour: Tour;
  drivers: Profil[];
  date: string;
  onOpened?: () => void;
  onDeleted?: () => void;
  children: ReactNode;
}

export function TourContextMenu({
  tour,
  drivers,
  date,
  onOpened,
  onDeleted,
  children,
}: TourContextMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const openPdfPreview = usePdfPreview();
  const deleteTour = useDeleteTour();

  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const locked = isTourClosed(tour.status);
  const canPdf = canDownloadTourPdf(user, "standard");
  const canPdfTarif = canDownloadTourPdf(user, "tarif");

  const openDialog = (setter: (open: boolean) => void) => {
    window.setTimeout(() => setter(true), 0);
  };

  const showPdf = (kind: TourPdfKind) => {
    openPdfPreview({
      key: ["tours", "pdf", tour.id, kind],
      title: t(kind === "tarif" ? "tours.pdfTarifTitle" : "tours.pdfTitle"),
      subtitle: tour.name,
      filename: tourPdfFilename(tour, kind, date),
      load: () => tourPdfService.fetch(tour.id, kind),
      describeError: (error) => t(pdfErrorKey(error)),
    });
  };

  return (
    <>
      <ContextMenu
        onOpenChange={(open) => {
          if (open) onOpened?.();
        }}
      >
        <ContextMenuTrigger asChild>
          <div>{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel className="flex items-center gap-1.5">
            <ColorDot color={tour.color || "#2563eb"} />
            <span className="truncate">{tour.name}</span>
          </ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem
            disabled={(tour.commands?.length ?? 0) === 0}
            onSelect={() => navigate(`/app/tours/${tour.id}/order`)}
          >
            <Wand2 />
            {t("tours.order.action")}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => openDialog(setStatusOpen)}>
            <CircleDot />
            {t("tours.changeStatus")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={locked}
            onSelect={() => openDialog(setAssignOpen)}
          >
            <UserPlus />
            {t("tours.assign")}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => openDialog(setHistoryOpen)}>
            <History />
            {t("tours.history.title")}
          </ContextMenuItem>
          {(canPdf || canPdfTarif) && (
            <>
              <ContextMenuSeparator />
              {canPdf && (
                <ContextMenuItem onSelect={() => showPdf("standard")}>
                  <FileDown />
                  {t("tours.pdf")}
                </ContextMenuItem>
              )}
              {canPdfTarif && (
                <ContextMenuItem onSelect={() => showPdf("tarif")}>
                  <ReceiptEuro />
                  {t("tours.pdfTarif")}
                </ContextMenuItem>
              )}
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => openDialog(setDeleteOpen)}
          >
            <Trash2 />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <TourStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        tourId={tour.id}
        tourName={tour.name}
      />
      <TourAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        tourId={tour.id}
        tourName={tour.name}
        drivers={drivers}
      />
      <TourHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        tourId={tour.id}
        tourName={tour.name}
      />
      <DeleteTourDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tourName={tour.name}
        pending={deleteTour.isPending}
        onConfirm={() =>
          deleteTour.mutate(tour.id, {
            onSettled: () => {
              setDeleteOpen(false);
              onDeleted?.();
            },
          })
        }
      />
    </>
  );
}
