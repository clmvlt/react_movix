import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { status } from "@/lib/colors";
import { useMap } from "./use-map";

export interface MapMarkerProps {
  longitude: number;
  latitude: number;
  color?: string;
  selectedColor?: string;
  selected?: boolean;
  title?: string;
  icon?: string;
  label?: string | number;
  size?: number;
  alert?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragEnd?: (longitude: number, latitude: number) => void;
}

function pinSvg(fill: string, withDot: boolean): string {
  const dot = withDot ? '<circle cx="12" cy="10" r="3.2" fill="#ffffff"/>' : "";
  return `<svg viewBox="0 1 24 21" width="100%" height="100%" style="display:block" fill="none"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="${fill}" stroke="#ffffff" stroke-width="1.6"/>${dot}</svg>`;
}

export function MapMarker({
  longitude,
  latitude,
  color = "#2563eb",
  selectedColor = "#7c3aed",
  selected = false,
  title,
  icon,
  label,
  size,
  alert = false,
  draggable = false,
  onClick,
  onDragEnd,
}: MapMarkerProps) {
  const { map, loaded } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const elementRef = useRef<HTMLButtonElement | null>(null);
  const baseFilterRef = useRef("");
  const draggedRef = useRef(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  useEffect(() => {
    if (!map || !loaded) return;

    const element = document.createElement("button");
    element.type = "button";
    element.style.padding = "0";
    element.style.border = "none";
    element.style.background = "transparent";
    element.style.cursor = "pointer";
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      onClickRef.current?.();
    });
    element.addEventListener("mouseenter", () => {
      element.style.filter = `${baseFilterRef.current} brightness(1.15)`;
    });
    element.addEventListener("mouseleave", () => {
      element.style.filter = baseFilterRef.current;
    });
    elementRef.current = element;

    const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
      .setLngLat([longitude, latitude])
      .addTo(map);
    markerRef.current = marker;

    const handleDrag = () => {
      draggedRef.current = true;
    };
    const handleDragEnd = () => {
      const position = marker.getLngLat();
      onDragEndRef.current?.(position.lng, position.lat);
    };
    marker.on("drag", handleDrag);
    marker.on("dragend", handleDragEnd);

    return () => {
      marker.off("drag", handleDrag);
      marker.off("dragend", handleDragEnd);
      marker.remove();
      markerRef.current = null;
      elementRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  useEffect(() => {
    markerRef.current?.setDraggable(draggable);
    const element = elementRef.current;
    if (element) element.style.cursor = draggable ? "grab" : "pointer";
  }, [draggable, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const element = elementRef.current;
    if (!element) return;

    const fill = selected ? selectedColor : color;
    const width = size ?? 38;
    const height = Math.round((width * 21) / 24);

    element.title = title ?? "";
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.zIndex = icon ? "4" : selected || alert ? "3" : "1";
    element.style.transition = "filter 0.1s ease";
    baseFilterRef.current = "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.45))";
    element.style.filter = baseFilterRef.current;

    const hasLabel = label !== undefined && label !== null && `${label}` !== "";
    let inner = pinSvg(fill, !icon && !hasLabel);
    if (icon) {
      const iconPx = Math.round(width * 0.42);
      inner += `<span style="position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);width:${iconPx}px;height:${iconPx}px;color:#ffffff;display:flex;align-items:center;justify-content:center;">${icon}</span>`;
    } else if (hasLabel) {
      const fontPx = Math.max(9, Math.round(width * 0.32));
      inner += `<span style="position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);color:#ffffff;font-weight:700;font-size:${fontPx}px;line-height:1;text-shadow:0 1px 1px rgba(0,0,0,0.55);">${label}</span>`;
    }
    if (alert) {
      const badgePx = Math.max(12, Math.round(width * 0.42));
      const offset = Math.round(badgePx / 4);
      inner += `<span style="position:absolute;right:-${offset}px;top:-${offset}px;width:${badgePx}px;height:${badgePx}px;border-radius:9999px;background:${status.danger.strong};border:2px solid #ffffff;color:#ffffff;font-weight:700;font-size:${Math.round(badgePx * 0.7)}px;line-height:1;display:flex;align-items:center;justify-content:center;">!</span>`;
    }
    element.innerHTML = `<div style="position:relative;width:100%;height:100%;pointer-events:none">${inner}</div>`;
  }, [color, selectedColor, selected, title, icon, label, size, alert, loaded]);

  return null;
}
