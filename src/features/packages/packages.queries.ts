import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { packagesApi } from "./packages.api";
import { packageKeys } from "./packages.keys";
import { PACKAGE_PAGE_SIZES } from "./packages.constants";
import type {
  PackageBarcodesInput,
  PackageSouffranceSearchInput,
  PackageStatusInput,
} from "./types";

const BY_COMMAND_SIZE = PACKAGE_PAGE_SIZES[PACKAGE_PAGE_SIZES.length - 1];

export function usePackageHistory(barcode: string | undefined) {
  return useQuery({
    queryKey: packageKeys.history(barcode ?? ""),
    queryFn: () => packagesApi.history(barcode as string),
    enabled: Boolean(barcode),
    retry: false,
  });
}

export function useSouffrancePackageSearch(
  input: PackageSouffranceSearchInput,
  enabled = true
) {
  return useQuery({
    queryKey: packageKeys.souffranceSearch(input),
    queryFn: () => packagesApi.searchSouffrance(input),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useSouffrancePackagesOfCommand(
  commandId: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: packageKeys.souffranceByCommand(commandId ?? ""),
    queryFn: () =>
      packagesApi.searchSouffrance({
        commandId: commandId as string,
        page: 0,
        size: BY_COMMAND_SIZE,
      }),
    enabled: enabled && Boolean(commandId),
    retry: false,
  });
}

function invalidatePackages(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: packageKeys.all });
}

export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageStatusInput) => packagesApi.updateState(input),
    onSuccess: () => invalidatePackages(queryClient),
  });
}

export function useSouffrancePackages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageBarcodesInput) => packagesApi.souffrance(input),
    onSuccess: () => invalidatePackages(queryClient),
  });
}

export function useRestoreSouffrancePackages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageBarcodesInput) =>
      packagesApi.restoreSouffrance(input),
    onSuccess: () => invalidatePackages(queryClient),
  });
}
