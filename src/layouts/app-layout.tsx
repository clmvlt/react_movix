import { Outlet, useLocation } from "react-router-dom";
import { AppNavbar } from "@/components/nav/app-navbar";
import { AppSideRail } from "@/components/nav/app-side-rail";
import { useNavBadges } from "@/components/nav/use-nav-badges";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { pathname } = useLocation();
  const badges = useNavBadges();
  const fullBleed =
    pathname.startsWith("/app/expeditions") ||
    pathname.startsWith("/app/tours") ||
    pathname.startsWith("/app/zones") ||
    pathname.startsWith("/app/todos") ||
    pathname.startsWith("/app/pharmacy-reports");

  return (
    <div className="flex h-dvh w-full bg-background">
      <AppSideRail badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar badges={badges} />
        <main
          className={cn(
            "min-h-0 w-full flex-1 overflow-y-auto",
            fullBleed && "flex flex-col px-4 py-4 sm:px-6 lg:overflow-hidden"
          )}
        >
          {fullBleed ? (
            <Outlet />
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
