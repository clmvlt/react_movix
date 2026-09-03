import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { setCanonical, setMetaDescription } from "@/lib/seo";
import { formatDate } from "@/lib/date";
import {
  LEGAL_PLACEHOLDER,
  type LegalBlock,
  type LegalDocumentContent,
} from "@/content/legal/types";

interface LegalDocumentProps {
  path: string;
  documentTitle: string;
  metaDescription: string;
  content: LegalDocumentContent;
}

function withPlaceholders(text: string): ReactNode {
  if (!text.includes(LEGAL_PLACEHOLDER)) return text;
  const parts = text.split(LEGAL_PLACEHOLDER);
  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <mark
            key={index}
            className="rounded-sm bg-status-warning-bg px-1 font-medium text-status-warning-text"
          >
            {LEGAL_PLACEHOLDER}
          </mark>,
          part,
        ]
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-sm leading-6 text-foreground">
          {withPlaceholders(block.text)}
        </p>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground">
          {block.items.map((item, index) => (
            <li key={index}>{withPlaceholders(item)}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {block.head.map((cell) => (
                  <th key={cell} scope="col" className="px-3 py-2 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-border align-top">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={
                        cellIndex === 0
                          ? "px-3 py-2 font-mono text-xs text-foreground"
                          : "px-3 py-2 text-foreground"
                      }
                    >
                      {withPlaceholders(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LegalDocument({
  path,
  documentTitle,
  metaDescription,
  content,
}: LegalDocumentProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = documentTitle;
    const restoreDescription = setMetaDescription(metaDescription);
    const restoreCanonical = setCanonical(path);
    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreCanonical();
    };
  }, [documentTitle, metaDescription, path]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <LandingHeader showAnchors={false} />

      <main className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("legal.updatedAt", { date: formatDate(content.updatedAt, i18n.resolvedLanguage) })}
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {content.intro}
            </p>
          </header>

          <nav
            aria-label={t("legal.tocLabel")}
            className="mt-8 rounded-lg border border-border bg-card p-4"
          >
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("legal.tocLabel")}
            </p>
            <ol className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {content.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-flex min-h-8 items-center text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-8">
            {content.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-20"
              >
                <h2
                  id={`${section.id}-title`}
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  {section.title}
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {section.blocks.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
