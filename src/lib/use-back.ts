import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useBack(fallback: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const hasHistory =
      (location.key && location.key !== "default") ||
      window.history.state?.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, location.key, fallback]);
}
