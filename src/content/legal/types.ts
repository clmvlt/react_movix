export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocumentContent {
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LEGAL_PLACEHOLDER = "[À COMPLÉTER]";
