// Leitura do "Relatório de ganhos" do Airbnb (PDF) direto no navegador.
// O pdf.js é carregado sob demanda via CDN, só quando o usuário importa um arquivo.

const PDFJS_VERSION = '4.10.38';
const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export interface AirbnbListingRow {
  property_title: string;
  gross_value: number;   // ganhos brutos + ajustes
  platform_fees: number; // taxas de serviço + imposto retido
  net_value: number;     // total (BRL)
  days: number;          // noites reservadas
}

export interface AirbnbReport {
  period_start: string | null;  // YYYY-MM-DD
  period_end: string | null;
  generated_at: string | null;
  rows: AirbnbListingRow[];
}

const MONTHS: Record<string, number> = {
  janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const toIsoDate = (day: string, monthName: string, year: string): string | null => {
  const m = MONTHS[monthName.toLowerCase()];
  if (!m) return null;
  return `${year}-${String(m).padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// "-R$ 1.234,56" -> -1234.56
const parseBRL = (s: string): number => {
  const negative = s.trim().startsWith('-');
  const num = parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  return negative ? -num : num;
};

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

let pdfjsPromise: Promise<any> | null = null;
const loadPdfJs = () => {
  if (!pdfjsPromise) {
    const url = PDFJS_URL;
    pdfjsPromise = import(/* @vite-ignore */ url).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return lib;
    });
  }
  return pdfjsPromise;
};

// Reconstrói as linhas visuais do PDF agrupando os textos pela altura (y).
const extractLines = async (file: File): Promise<string[]> => {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows: { y: number; items: { x: number; str: string }[] }[] = [];

    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const row = rows.find((r) => Math.abs(r.y - y) < 3);
      if (row) row.items.push({ x, str: item.str });
      else rows.push({ y, items: [{ x, str: item.str }] });
    }

    rows
      .sort((a, b) => b.y - a.y)
      .forEach((r) => {
        const text = r.items.sort((a, b) => a.x - b.x).map((i) => i.str).join(' ');
        lines.push(text.replace(/\s+/g, ' ').trim());
      });
  }
  return lines;
};

const MONEY = '-?R\\$\\s?[\\d.]+,\\d{2}';
const LISTING_ROW = new RegExp(`^(.+?)\\s+(${MONEY})\\s+(${MONEY})\\s+(${MONEY})\\s+(${MONEY})\\s+(${MONEY})$`);
const NIGHTS_ROW = /^(.+?)\s+(\d+)\s+(\d+(?:[.,]\d+)?)$/;

export const parseAirbnbReport = async (file: File): Promise<AirbnbReport> => {
  const lines = await extractLines(file);
  const fullText = lines.join(' ');

  // Período: "1 de outubro de 2026 – 31 de outubro de 2026"
  let period_start: string | null = null;
  let period_end: string | null = null;
  const periodMatch = fullText.match(
    /(\d{1,2}) de ([a-zç]+) de (\d{4})\s*[–—-]\s*(\d{1,2}) de ([a-zç]+) de (\d{4})/i
  );
  if (periodMatch) {
    period_start = toIsoDate(periodMatch[1], periodMatch[2], periodMatch[3]);
    period_end = toIsoDate(periodMatch[4], periodMatch[5], periodMatch[6]);
  }

  // Data de geração: "Relatório gerado em: 8 de novembro de 2026"
  let generated_at: string | null = null;
  const genMatch = fullText.match(/gerado em:?\s*(\d{1,2}) de ([a-zç]+) de\s*(\d{4})/i);
  if (genMatch) generated_at = toIsoDate(genMatch[1], genMatch[2], genMatch[3]);

  // Linhas de acomodações (seção entre "Acomodações" e "Tipos de ganhos")
  const startIdx = lines.findIndex((l) => /^Acomoda[çc][õo]es$/i.test(l));
  const endIdx = lines.findIndex((l, i) => i > startIdx && /^Tipos de ganhos/i.test(l));
  const section = startIdx >= 0 ? lines.slice(startIdx + 1, endIdx > 0 ? endIdx : undefined) : lines;

  const rows: AirbnbListingRow[] = [];
  for (const line of section) {
    const m = line.match(LISTING_ROW);
    if (!m) continue;
    const title = m[1].trim();
    if (/^(ganhos|resumo|acomoda[çc][ãa]o)$/i.test(title)) continue;
    const bruto = parseBRL(m[2]);
    const ajustes = parseBRL(m[3]);
    const taxas = parseBRL(m[4]);
    const imposto = parseBRL(m[5]);
    const total = parseBRL(m[6]);
    rows.push({
      property_title: title,
      gross_value: +(bruto + ajustes).toFixed(2),
      platform_fees: +(Math.abs(taxas) + Math.abs(imposto)).toFixed(2),
      net_value: total,
      days: 0,
    });
  }

  // Noites reservadas por acomodação (última seção "Estatísticas de desempenho")
  for (const line of lines) {
    const m = line.match(NIGHTS_ROW);
    if (!m) continue;
    const row = rows.find((r) => normalize(r.property_title) === normalize(m[1]));
    if (row) row.days = parseInt(m[2], 10);
  }

  return { period_start, period_end, generated_at, rows };
};
