import { useTranslation } from "react-i18next";
import {
  FileText,
  MapPinOff,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KeyTag } from "@/components/key-tag";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { hasValidLocation } from "@/lib/address-form";
import { clientLabel, isPharmacyClient, type Client } from "@/features/clients";
import { ClientTypeIcon } from "./client-type-icon";

interface ClientTableProps {
  rows: Client[];
  canEdit: boolean;
  onOpen: (client: Client) => void;
  onEdit: (client: Client) => void;
  onLabel: (client: Client) => void;
  onOrders: (client: Client) => void;
  onCreateOrder: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({
  rows,
  canEdit,
  onOpen,
  onEdit,
  onLabel,
  onOrders,
  onCreateOrder,
  onDelete,
}: ClientTableProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full rounded-t-xl border-x border-t">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>{t("clients.fields.name")}</TableHead>
            <TableHead className="w-[112px]">
              {t("clients.fields.cip")}
            </TableHead>
            <TableHead className="hidden w-[160px] sm:table-cell">
              {t("clients.columns.place")}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("clients.fields.address1")}
            </TableHead>
            <TableHead className="hidden w-[140px] md:table-cell">
              {t("clients.fields.zone")}
            </TableHead>
            <TableHead className="w-[68px] text-right lg:w-[60px]">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const pharmacy = isPharmacyClient(row) ? row : null;
            const label = clientLabel(row) || t("clients.untitled");
            const located = hasValidLocation(row);
            return (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => onOpen(row)}
              >
                <TableCell className="font-medium">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <ClientTypeIcon
                      type={row.type}
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 truncate">{label}</span>
                    {pharmacy && (
                      <KeyTag color={pharmacy.color} numero={pharmacy.numero} />
                    )}
                    <DeliveryWindowBadge
                      start={row.deliveryWindowStart}
                      end={row.deliveryWindowEnd}
                    />
                    {!located && (
                      <Badge variant="outline" className="shrink-0">
                        <MapPinOff className="size-3" />
                        <span className="hidden sm:inline">
                          {t("clients.badges.noLocation")}
                        </span>
                      </Badge>
                    )}
                    {row.neverOrdered === true && (
                      <Badge variant="secondary" className="shrink-0">
                        <Sparkles className="size-3" />
                        <span className="hidden sm:inline">
                          {t("clients.badges.neverOrdered")}
                        </span>
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  <span className="block truncate">{pharmacy?.cip ?? "-"}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  <span className="block truncate">
                    {[row.postalCode, row.city].filter(Boolean).join(" ")}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <span className="block truncate">{row.address1 ?? ""}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  <span className="block truncate">
                    {row.zone?.name ?? t("clients.noZone")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 lg:size-9"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={t("common.actions")}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onOpen(row)}
                      >
                        {t("clients.openDetail")}
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem
                          className="min-h-11 lg:min-h-9"
                          onSelect={() => onEdit(row)}
                        >
                          <Pencil />
                          {t("common.edit")}
                        </DropdownMenuItem>
                      )}
                      {pharmacy && (
                        <DropdownMenuItem
                          className="min-h-11 lg:min-h-9"
                          onSelect={() => onLabel(row)}
                        >
                          <FileText />
                          {t("clients.label.downloadLong")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onOrders(row)}
                      >
                        <Package />
                        {t("clients.orders.all")}
                      </DropdownMenuItem>
                      {pharmacy && (
                        <DropdownMenuItem
                          className="min-h-11 lg:min-h-9"
                          onSelect={() => onCreateOrder(row)}
                        >
                          <Plus />
                          {t("clients.orders.create")}
                        </DropdownMenuItem>
                      )}
                      {canEdit && !pharmacy && (
                        <DropdownMenuItem
                          className="min-h-11 text-destructive focus:text-destructive lg:min-h-9"
                          onSelect={() => onDelete(row)}
                        >
                          <Trash2 />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
