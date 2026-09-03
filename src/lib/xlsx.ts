import ExcelJS from "exceljs";
import { currentLanguage } from "@/i18n";
import { parseDate } from "./date";
import { downloadBlob } from "./download";

export type CellFormat =
  | "text"
  | "integer"
  | "decimal"
  | "currency"
  | "weight"
  | "distance"
  | "rate"
  | "date"
  | "datetime"
  | "boolean";

const NUM_FMT: Record<CellFormat, string> = {
  text: "@",
  integer: "#,##0",
  decimal: "#,##0.00",
  currency: '#,##0.00 €',
  weight: '#,##0.00 "kg"',
  distance: '#,##0.0 "km"',
  rate: '0.00"%"',
  date: "@",
  datetime: "@",
  boolean: "@",
};

export interface BooleanLabels {
  yes: string;
  no: string;
}

export interface SheetColumn<T> {
  header: string;
  value(row: T): unknown;
  format?: CellFormat;
  formatOf?(row: T): CellFormat | undefined;
}

export interface SheetSpec<T = unknown> {
  name: string;
  columns: SheetColumn<T>[];
  rows: T[];
  totals?: Record<string, unknown> | null;
  note?: string;
}

export type WorkbookSpec = SheetSpec<unknown>[];

export type CellValue = string | number | null;

interface ComputedCell {
  value: CellValue;
  display: string;
  format?: CellFormat;
}

let booleanLabels: BooleanLabels = { yes: "Yes", no: "No" };

export function setWorkbookBooleanLabels(labels: BooleanLabels): void {
  booleanLabels = labels;
}

function intlLocale(): string {
  return currentLanguage().startsWith("fr") ? "fr-FR" : "en-GB";
}

function sheetDate(value: unknown): string | null {
  const date = parseDate(value as string);
  if (!date) return null;
  return date.toLocaleDateString(intlLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function sheetDateTime(value: unknown): string | null {
  const date = parseDate(value as string);
  if (!date) return null;
  return `${date.toLocaleDateString(intlLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${date.toLocaleTimeString(intlLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function rowFormat<T>(
  column: SheetColumn<T>,
  row: T
): CellFormat | undefined {
  return column.formatOf ? column.formatOf(row) : column.format;
}

function toCellValue(raw: unknown, format: CellFormat | undefined): CellValue {
  if (raw === null || raw === undefined || raw === "") return null;

  switch (format) {
    case "date":
      return sheetDate(raw);
    case "datetime":
      return sheetDateTime(raw);
    case "boolean":
      return raw ? booleanLabels.yes : booleanLabels.no;
    case "text":
      return String(raw);
    case "integer":
    case "decimal":
    case "currency":
    case "weight":
    case "distance":
    case "rate": {
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? numeric : null;
    }
    default:
      if (typeof raw === "boolean") {
        return raw ? booleanLabels.yes : booleanLabels.no;
      }
      if (typeof raw === "number") {
        return Number.isFinite(raw) ? raw : null;
      }
      return String(raw);
  }
}

export function displayCell(
  value: CellValue,
  format: CellFormat | undefined
): string {
  if (value === null) return "";
  if (typeof value !== "number") return value;

  const locale = intlLocale();
  switch (format) {
    case "integer":
      return value.toLocaleString(locale, { maximumFractionDigits: 0 });
    case "currency":
      return `${value.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`;
    case "weight":
      return `${value.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kg`;
    case "distance":
      return `${value.toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} km`;
    case "rate":
      return `${value.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} %`;
    case "decimal":
      return value.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    default:
      return value.toLocaleString(locale);
  }
}

export function formatValue(
  value: number | string | null | undefined,
  format: CellFormat
): string {
  if (value === null || value === undefined || value === "") return "";
  return displayCell(value, format);
}

function computeRow<T>(spec: SheetSpec<T>, row: T): ComputedCell[] {
  return spec.columns.map((column) => {
    const format = rowFormat(column, row);
    const value = toCellValue(column.value(row), format);
    return { value, display: displayCell(value, format), format };
  });
}

function computeTotalsRow<T>(spec: SheetSpec<T>): ComputedCell[] | null {
  if (!spec.totals) return null;
  const totals = spec.totals;
  return spec.columns.map((column) => {
    const value = toCellValue(totals[column.header], column.format);
    return {
      value,
      display: displayCell(value, column.format),
      format: column.format,
    };
  });
}

export function sheetToRecords<T>(
  spec: SheetSpec<T>
): Record<string, string>[] {
  const toRecord = (cells: ComputedCell[]): Record<string, string> => {
    const record: Record<string, string> = {};
    spec.columns.forEach((column, index) => {
      record[column.header] = cells[index]?.display ?? "";
    });
    return record;
  };

  const records = spec.rows.map((row) => toRecord(computeRow(spec, row)));
  const totals = computeTotalsRow(spec);
  if (totals) records.push(toRecord(totals));
  return records;
}

export function addSpecSheet<T>(
  workbook: ExcelJS.Workbook,
  spec: SheetSpec<T>
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet(spec.name);
  const headers = spec.columns.map((column) => column.header);
  if (headers.length === 0) return worksheet;

  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };

  const widths = headers.map((header) => header.length);
  const bodyRows = spec.rows.map((row) => computeRow(spec, row));
  const totalsRow = computeTotalsRow(spec);
  const allRows = totalsRow ? [...bodyRows, totalsRow] : bodyRows;

  allRows.forEach((cells, rowIndex) => {
    const excelRow = worksheet.addRow(cells.map((cell) => cell.value));
    cells.forEach((cell, columnIndex) => {
      if (cell.format) {
        excelRow.getCell(columnIndex + 1).numFmt = NUM_FMT[cell.format];
      }
      widths[columnIndex] = Math.max(widths[columnIndex], cell.display.length);
    });
    if (totalsRow && rowIndex === allRows.length - 1) {
      excelRow.font = { bold: true };
    }
  });

  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = Math.min(width + 2, 50);
  });

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  return worksheet;
}

export interface SummaryLine {
  label: string;
  value: unknown;
  format?: CellFormat;
}

export function summarySheet(
  name: string,
  metricHeader: string,
  valueHeader: string,
  lines: SummaryLine[]
): SheetSpec<SummaryLine> {
  return {
    name,
    rows: lines,
    columns: [
      { header: metricHeader, value: (line) => line.label, format: "text" },
      {
        header: valueHeader,
        value: (line) => line.value,
        formatOf: (line) => line.format,
      },
    ],
  };
}

export type BuildProgress = (percent: number, statusKey: string) => void;

export async function downloadWorkbook(
  specs: WorkbookSpec,
  fileName: string,
  onProgress?: BuildProgress
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const steps = specs.length + 2;

  specs.forEach((spec, index) => {
    onProgress?.(Math.round((index / steps) * 100), spec.name);
    addSpecSheet(workbook, spec);
  });

  onProgress?.(Math.round((specs.length / steps) * 100), "generating");
  const buffer = await workbook.xlsx.writeBuffer();

  onProgress?.(Math.round(((specs.length + 1) / steps) * 100), "downloading");
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, fileName);

  onProgress?.(100, "done");
}
