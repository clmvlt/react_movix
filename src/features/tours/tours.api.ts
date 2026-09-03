import { http } from "@/lib/http";
import type {
  StatusRef,
  Tour,
  TourAssignInput,
  TourCreateInput,
  TourOptimizeInput,
  TourOptimizeResult,
  TourRoute,
  TourStatusInput,
  TourUpdateInput,
  TourUpdateOrderInput,
} from "./types";

const RESOURCE = "/tours";

const ROUTING_TIMEOUT = 90_000;

export const toursApi = {
  byDate: (date: string) => http.get<Tour[]>(`${RESOURCE}/by-date/${date}`),

  get: (id: string) => http.get<Tour>(`${RESOURCE}/${id}`),

  history: (id: string) => http.get<StatusRef[]>(`${RESOURCE}/history/${id}`),

  create: (input: TourCreateInput) => http.post<Tour>(RESOURCE, input),

  update: (id: string, input: TourUpdateInput) =>
    http.put<Tour>(`${RESOURCE}/${id}`, input),

  updateState: (input: TourStatusInput) =>
    http.put<void>(`${RESOURCE}/state`, input),

  updateOrder: (id: string, input: TourUpdateOrderInput) =>
    http.put<TourRoute>(`${RESOURCE}/update-order/${id}`, {
      commands: input.commands,
    }),

  route: (id: string) => http.get<TourRoute>(`${RESOURCE}/${id}/route`),

  previewRoute: (id: string, input: TourUpdateOrderInput) =>
    http.post<TourRoute>(
      `${RESOURCE}/${id}/route/preview`,
      { commands: input.commands },
      { timeoutMs: ROUTING_TIMEOUT }
    ),

  refreshRoute: (id: string) =>
    http.post<TourRoute>(`${RESOURCE}/${id}/route/refresh`, undefined, {
      timeoutMs: ROUTING_TIMEOUT,
    }),

  optimize: (id: string, input?: TourOptimizeInput) =>
    http.post<TourOptimizeResult>(
      `${RESOURCE}/${id}/optimize`,
      {
        apply: input?.apply ?? false,
        ...(input?.departureTime ? { departureTime: input.departureTime } : {}),
      },
      { timeoutMs: ROUTING_TIMEOUT }
    ),

  assign: (id: string, input: TourAssignInput) =>
    http.put<void>(`${RESOURCE}/assign/${id}`, input),

  unassign: (id: string) => http.put<void>(`${RESOURCE}/unassign/${id}`),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${id}`),

  pdf: (id: string) => http.blob(`${RESOURCE}/pdf/${id}`, { body: {} }),

  pdfTarif: (id: string) =>
    http.blob(`${RESOURCE}/pdf-tarif/${id}`, { body: {} }),
};
