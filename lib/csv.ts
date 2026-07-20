export type ParsedCsv = { headers: string[]; rows: string[][] };

// Excel on Balkan-locale Windows exports "CSV" as Windows-1250 (ANSI), not
// UTF-8, which mangles š/đ/č/ć/ž into mojibake if read as UTF-8. Try a strict
// UTF-8 decode first (real UTF-8 files, the common case, pass through
// untouched); if the bytes aren't valid UTF-8, fall back to Windows-1250.
export async function readCsvFileText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1250").decode(buffer);
  }
}

// Minimal RFC 4180-ish parser: handles quoted fields, escaped quotes ("")
// and commas/newlines inside quotes. Good enough for spreadsheet exports.
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // skip, \n (or end of file) handles the row break
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  const [headers, ...dataRows] = nonEmptyRows;
  return { headers: headers ?? [], rows: dataRows };
}
