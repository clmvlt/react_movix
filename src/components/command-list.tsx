import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import {
  clientLabel,
  isPharmacyClient,
  type Client,
} from "@/features/clients";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Building2,
  ChevronRight,
  Clock,
  KeyRound,
  MapPin,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { commandStatusCategory, commandStatusHasTime } from "@/lib/status";
import { formatDateTime, formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { contrastTextOn, normalizeHexColor } from "@/lib/colors";

export interface CommandListEntry {
  id: string;
  client?: Client | null;
  status?: { id: number; name: string; createdAt?: string | null } | null;
  tour?: { name: string; color?: string } | null;
  newPharmacy?: boolean;
  packagesNumber?: number;
  packages?: unknown[];
  tourOrder?: number | null;
  closeDate?: string | null;
  estimatedArrival?: Date | null;
  pharmacyDeliveryWindowStart?: string | null;
  pharmacyDeliveryWindowEnd?: string | null;
}

export interface CommandListItemContext {
  selected: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  onOpenPharmacy?: () => void;
  onLocate?: () => void;
}

export interface CommandListHandle {
  scrollToId: (id: string) => void;
}

const ROW_ESTIMATE = 56;

interface CommandListProps {
  items: CommandListEntry[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onOpen?: (id: string) => void;
  onOpenPharmacy?: (cip: string) => void;
  onLocate?: (id: string) => void;
  ref?: Ref<CommandListHandle>;
  renderItem?: (
    command: CommandListEntry,
    ctx: CommandListItemContext
  ) => ReactNode;
  wrapItem?: (
    command: CommandListEntry,
    node: ReactNode,
    ctx: CommandListItemContext
  ) => ReactNode;
  className?: string;
  listClassName?: string;
  selectable?: boolean;
  showOrder?: boolean;
  showDate?: boolean;
}

export function CommandList({
  items,
  selectedIds,
  onToggle,
  onOpen,
  onOpenPharmacy,
  onLocate,
  ref,
  renderItem,
  wrapItem,
  className,
  listClassName,
  selectable = true,
  showOrder = false,
  showDate = false,
}: CommandListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 12,
    getItemKey: (index) => items[index].id,
  });

  useImperativeHandle(ref, () => ({
    scrollToId: (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) virtualizer.scrollToIndex(index, { align: "auto" });
    },
  }));

  return (
    <div
      ref={scrollRef}
      className={cn("min-h-0 overflow-y-auto pr-1", className)}
    >
      <ul
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card",
          listClassName
        )}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const index = row.index;
          const command = items[index];
          const client = command.client ?? null;
          const ctx: CommandListItemContext = {
            selected: selectedIds.has(command.id),
            onToggle: () => onToggle(command.id),
            onOpen: onOpen ? () => onOpen(command.id) : undefined,
            onOpenPharmacy:
              onOpenPharmacy && client
                ? () => onOpenPharmacy(client.id)
                : undefined,
            onLocate:
              onLocate &&
              client?.latitude != null &&
              client?.longitude != null
                ? () => onLocate(command.id)
                : undefined,
          };
          const node = renderItem ? (
            renderItem(command, ctx)
          ) : (
            <CommandListItem
              command={command}
              index={index}
              selectable={selectable}
              showOrder={showOrder}
              showDate={showDate}
              {...ctx}
            />
          );
          return (
            <li
              key={row.key}
              data-index={index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0 top-0 border-b border-border last:border-b-0"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              {wrapItem ? wrapItem(command, node, ctx) : node}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TimeChip({
  value,
  label,
  estimated = false,
}: {
  value: string;
  label: string;
  estimated?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium tabular-nums",
        estimated
          ? "border-dashed border-muted-foreground/40 text-muted-foreground"
          : "border-transparent bg-muted text-foreground"
      )}
      title={label}
      aria-label={label}
    >
      {estimated && <Clock aria-hidden className="size-3 shrink-0" />}
      {value}
    </span>
  );
}

interface CommandListItemProps extends CommandListItemContext {
  command: CommandListEntry;
  index?: number;
  selectable?: boolean;
  showOrder?: boolean;
  showDate?: boolean;
  className?: string;
}

export function CommandListItem({
  command,
  selected,
  onToggle,
  onOpen,
  onOpenPharmacy,
  onLocate,
  index = 0,
  selectable = true,
  showOrder = false,
  showDate = false,
  className,
}: CommandListItemProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const client = command.client ?? null;
  const keyClient = client && isPharmacyClient(client) ? client : null;
  const pharmacyName = client
    ? clientLabel(client)
    : t("commands.noPharmacy");
  const location = [client?.postalCode, client?.city]
    .filter(Boolean)
    .join(" ");
  const packageCount = command.packagesNumber ?? command.packages?.length ?? 0;
  const keyNumber = keyClient?.numero?.trim() || null;
  const keyColor = normalizeHexColor(keyClient?.color);
  const order = command.tourOrder ?? index + 1;
  const passedAt =
    showDate && commandStatusHasTime(command.status?.id)
      ? command.status?.createdAt
      : null;
  const timeChip = command.estimatedArrival ? (
    <TimeChip
      estimated
      value={formatTime(command.estimatedArrival, lang)}
      label={t("tours.eta.label", {
        time: formatTime(command.estimatedArrival, lang),
      })}
    />
  ) : passedAt ? (
    <TimeChip
      value={formatTime(passedAt, lang)}
      label={t("tours.eta.actual", {
        datetime: formatDateTime(passedAt, lang),
      })}
    />
  ) : null;

  return (
    <div
      onClick={selectable ? onToggle : undefined}
      className={cn(
        "flex flex-col gap-0.5 px-2 py-1.5 transition-colors",
        selectable && "cursor-pointer",
        selected ? "bg-primary/10" : "hover:bg-accent",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showOrder && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {order}
          </span>
        )}
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={pharmacyName}
          />
        )}
        {command.tour && !showOrder && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: command.tour.color || "#2563eb" }}
            title={command.tour.name}
          />
        )}
        <span
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground"
          title={pharmacyName}
        >
          {pharmacyName}
        </span>
        {command.newPharmacy && (
          <Badge
            className="shrink-0 px-1.5 py-0 text-[10px] uppercase leading-4"
            title={t("commands.newPharmacyTitle")}
            aria-label={t("commands.newPharmacyTitle")}
          >
            {t("commands.newPharmacy")}
          </Badge>
        )}
        {timeChip}
        {command.status && (
          <StatusBadge
            label={command.status.name}
            category={commandStatusCategory(command.status.id)}
            className="shrink-0"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-left text-xs text-muted-foreground">
          {location}
        </span>
        <DeliveryWindowBadge
          start={
            command.pharmacyDeliveryWindowStart ??
            client?.deliveryWindowStart
          }
          end={
            command.pharmacyDeliveryWindowEnd ??
            client?.deliveryWindowEnd
          }
        />
        {keyNumber && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-xs tabular-nums",
              keyColor
                ? "rounded-sm px-1.5 py-0.5 font-medium"
                : "text-muted-foreground"
            )}
            style={
              keyColor
                ? { backgroundColor: keyColor, color: contrastTextOn(keyColor) }
                : undefined
            }
            title={t("clientReports.info.numero")}
            aria-label={`${t("clientReports.info.numero")} ${keyNumber}`}
          >
            <KeyRound aria-hidden className="size-3.5" />
            {keyNumber}
          </span>
        )}
        <span
          className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground"
          title={`${packageCount} ${t("expeditions.packages")}`}
          aria-label={`${packageCount} ${t("expeditions.packages")}`}
        >
          <Package aria-hidden className="size-3.5" />
          {packageCount}
        </span>
        {onLocate && (
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 lg:size-7"
            onClick={(event) => {
              event.stopPropagation();
              onLocate();
            }}
            title={t("commands.locate")}
            aria-label={t("commands.locate")}
          >
            <MapPin className="size-3.5" />
          </Button>
        )}
        {onOpenPharmacy && (
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 lg:size-7"
            onClick={(event) => {
              event.stopPropagation();
              onOpenPharmacy();
            }}
            title={t("commands.openPharmacy")}
            aria-label={t("commands.openPharmacy")}
          >
            <Building2 className="size-4" />
          </Button>
        )}
        {onOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 lg:size-7"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            title={t("expeditions.open")}
            aria-label={t("expeditions.open")}
          >
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
