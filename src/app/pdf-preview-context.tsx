import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  PdfPreviewDialog,
  type PdfPreviewRequest,
} from "@/components/pdf-preview-dialog";

type PdfPreviewApi = (request: PdfPreviewRequest) => void;

const PdfPreviewContext = createContext<PdfPreviewApi | undefined>(undefined);

export function PdfPreviewProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PdfPreviewRequest | null>(null);

  const open = useCallback(
    (next: PdfPreviewRequest) => setRequest(next),
    []
  );

  return (
    <PdfPreviewContext.Provider value={open}>
      {children}
      <PdfPreviewDialog
        request={request}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRequest(null);
        }}
      />
    </PdfPreviewContext.Provider>
  );
}

export function usePdfPreview(): PdfPreviewApi {
  const ctx = useContext(PdfPreviewContext);
  if (!ctx) {
    throw new Error("usePdfPreview must be used within PdfPreviewProvider");
  }
  return ctx;
}
