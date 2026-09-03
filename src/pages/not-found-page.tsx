import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { setRobotsNoindex } from "@/lib/seo";

export function NotFoundPage() {
  const { t } = useTranslation();
  useEffect(() => setRobotsNoindex(), []);
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-5xl font-semibold text-primary">404</p>
      <h1 className="text-xl font-semibold text-foreground">
        {t("errors.notFound")}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("errors.notFoundDesc")}
      </p>
      <Button asChild className="mt-2">
        <Link to="/app">{t("errors.backHome")}</Link>
      </Button>
    </div>
  );
}
