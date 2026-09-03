import { useTranslation } from "react-i18next";
import {
  FileText,
  MapPinOff,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Sparkles,
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
import { hasValidLocation } from "@/components/pharmacies/pharmacy-utils";
import { PharmacyTag } from "@/components/pharmacies/pharmacy-tag";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import type { Pharmacy } from "@/features/pharmacies";

interface PharmacyTableProps {
  rows: Pharmacy[];
  onOpen: (cip: string) => void;
  onEdit: (pharmacy: Pharmacy) => void;
  onLabel: (pharmacy: Pharmacy) => void;
  onOrders: (pharmacy: Pharmacy) => void;
  onCreateOrder: (pharmacy: Pharmacy) => void;
}

export function PharmacyTable({
  rows,
  onOpen,
  onEdit,
  onLabel,
  onOrders,
  onCreateOrder,
}: PharmacyTableProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full rounded-t-xl border-x border-t">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead className="w-[112px]">
              {t("pharmacies.columns.cip")}
            </TableHead>
            <TableHead className="hidden w-[160px] sm:table-cell">
              {t("pharmacies.columns.location")}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("common.address")}
            </TableHead>
            <TableHead className="hidden w-[140px] md:table-cell">
              {t("pharmacies.columns.zone")}
            </TableHead>
            <TableHead className="w-[68px] text-right lg:w-[60px]">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = row.name?.trim() || t("pharmacies.untitled");
            const located = hasValidLocation(row);
            return (
              <TableRow
                key={row.cip}
                className="cursor-pointer"
                onClick={() => onOpen(row.cip)}
              >
                <TableCell className="font-medium">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="min-w-0 truncate">{label}</span>
                    <PharmacyTag color={row.color} numero={row.numero} />
                    <DeliveryWindowBadge
                      start={row.deliveryWindowStart}
                      end={row.deliveryWindowEnd}
                    />
                    {!located && (
                      <Badge variant="outline" className="shrink-0">
                        <MapPinOff className="size-3" />
                        <span className="hidden sm:inline">
                          {t("pharmacies.badges.noLocation")}
                        </span>
                      </Badge>
                    )}
                    {row.neverOrdered === true && (
                      <Badge variant="secondary" className="shrink-0">
                        <Sparkles className="size-3" />
                        <span className="hidden sm:inline">
                          {t("pharmacies.badges.neverOrdered")}
                        </span>
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  <span className="block truncate">{row.cip}</span>
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
                    {row.zone?.name ?? t("pharmacies.info.noZone")}
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
                        onSelect={() => onOpen(row.cip)}
                      >
                        {t("pharmacies.openDetail")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onEdit(row)}
                      >
                        <Pencil />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onLabel(row)}
                      >
                        <FileText />
                        {t("pharmacies.label.downloadLong")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onOrders(row)}
                      >
                        <Package />
                        {t("pharmacies.orders.all")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onCreateOrder(row)}
                      >
                        <Plus />
                        {t("pharmacies.orders.create")}
                      </DropdownMenuItem>
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
