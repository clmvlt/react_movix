import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { orsApi } from "./ors.api";
import { orsKeys } from "./ors.keys";
import {
  ORS_SEARCH_MIN_CHARS,
  type AddressSearchParams,
  type MatrixRequest,
  type OptimizeRequest,
  type RouteRequest,
} from "./types";

const STATUS_STALE_TIME = 30_000;
const STATUS_POLL_INTERVAL = 15_000;
const SEARCH_STALE_TIME = 5 * 60_000;

export function useOrsStatus(enabled = true) {
  return useQuery({
    queryKey: orsKeys.status(),
    queryFn: ({ signal }) => orsApi.status(signal),
    enabled,
    staleTime: STATUS_STALE_TIME,
  });
}

export function useRoutingStatus(enabled = true) {
  return useQuery({
    queryKey: orsKeys.routingStatus(),
    queryFn: ({ signal }) => orsApi.routingStatus(signal),
    enabled,
    staleTime: STATUS_STALE_TIME,
    refetchInterval: (query) =>
      query.state.data?.ready ? false : STATUS_POLL_INTERVAL,
  });
}

export function useGeocodingStatus(enabled = true) {
  return useQuery({
    queryKey: orsKeys.geocodingStatus(),
    queryFn: ({ signal }) => orsApi.geocodingStatus(signal),
    enabled,
    staleTime: STATUS_STALE_TIME,
    refetchInterval: (query) =>
      query.state.data?.ready ? false : STATUS_POLL_INTERVAL,
  });
}

export function useAddressSearch(
  params: AddressSearchParams,
  enabled = true
) {
  const query = params.q.trim();
  return useQuery({
    queryKey: orsKeys.searchQuery({ ...params, q: query }),
    queryFn: ({ signal }) => orsApi.search({ ...params, q: query }, signal),
    enabled: enabled && query.length >= ORS_SEARCH_MIN_CHARS,
    staleTime: SEARCH_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useOrsRoute() {
  return useMutation({
    mutationFn: (input: RouteRequest) => orsApi.route(input),
  });
}

export function useOrsMatrix() {
  return useMutation({
    mutationFn: (input: MatrixRequest) => orsApi.matrix(input),
  });
}

export function useOrsOptimize() {
  return useMutation({
    mutationFn: (input: OptimizeRequest) => orsApi.optimize(input),
  });
}
