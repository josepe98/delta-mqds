import { MQDEntry } from '../types';
import { createEntry } from '../store';

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

const AIRPORT_CODE = /^[A-Z]{3}$/;

function parseDate(text: string): string | null {
  const m = text.match(/([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})/);
  if (!m) return null;
  const month = MONTH_MAP[m[1]];
  if (!month) return null;
  return `${m[3]}-${month}-${m[2].padStart(2, '0')}`;
}

function parseMoney(text: string): number {
  const m = text.match(/\$?([-,\d]+)/);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

function parseDollarAmount(text: string): number {
  const m = text.match(/\$([-,\d]+)/);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

function parseMiles(text: string): number {
  const m = text.match(/([-,\d]+)\s*Miles/);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

// pdf.js emits text items separated by "\n \n" for items on the same visual line,
// and "\n\n" for items on different visual lines.
// We reconstruct proper lines by joining "\n \n" into spaces, then splitting on "\n\n".
function normalizeText(text: string): string[] {
  // Join same-line fragments: "\n \n" -> " "
  const joined = text.replace(/\n \n/g, ' ');

  return joined
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (/^\d+ of \d+/.test(l)) return false;
      if (/^https?:\/\//.test(l)) return false;
      if (/^\d+\/\d+\/\d+,\s+\d+:\d+/.test(l)) return false;
      if (l.startsWith('Account Activity')) return false;
      if (l === 'View Receipt') return false;
      if (l === 'View AMEX Benefits') return false;
      if (l === 'View AMEX benefits') return false;
      if (l === 'View Details') return false;
      if (l === 'View Partner Network') return false;
      if (l.startsWith('Seat Purchase')) return false;
      return true;
    });
}

interface ParsedBlock {
  category: string;
  description: string;
  origin?: string;
  destination?: string;
  flightNumber?: string;
  date: string;
  postedDate?: string;
  totalMiles: number;
  baseMiles: number;
  bonusMiles: number;
  totalMQDs: number;
  baseMQDs: number;
  bonusMQDs: number;
  ticketNumber?: string;
  status: 'Complete' | 'Pending';
}

function parsePendingSection(lines: string[]): ParsedBlock[] {
  const entries: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    // After normalization, pending flights look like: "ATL CDG"
    // or still separate lines: "ATL" then "CDG" — check both
    let origin: string | undefined;
    let dest: string | undefined;

    // Check for "ORIGIN DEST" on one line (after join)
    const pairMatch = lines[i].match(/^([A-Z]{3})\s+([A-Z]{3})$/);
    if (pairMatch) {
      origin = pairMatch[1];
      dest = pairMatch[2];
      i++;
    } else if (AIRPORT_CODE.test(lines[i]) && i + 1 < lines.length && AIRPORT_CODE.test(lines[i + 1])) {
      origin = lines[i];
      dest = lines[i + 1];
      i += 2;
    }

    if (origin && dest) {
      let totalMiles = 0;
      let date = '';
      let totalMQDs = 0;

      // Scan next few lines for date, miles, MQDs
      const scanLimit = Math.min(i + 8, lines.length);
      while (i < scanLimit) {
        const line = lines[i];
        if (line.includes('Miles')) {
          totalMiles = parseMiles(line);
        }
        if (line.includes('Pending')) {
          const d = parseDate(line);
          if (d) date = d;
        }
        if (line.includes('MQDs')) {
          totalMQDs = parseDollarAmount(line);
        }
        // Stop if we hit the next flight entry
        const nextPair = line.match(/^([A-Z]{3})\s+([A-Z]{3})$/);
        if (nextPair && date) {
          break;
        }
        if (AIRPORT_CODE.test(line) && i + 1 < lines.length && AIRPORT_CODE.test(lines[i + 1]) && date) {
          break;
        }
        i++;
      }

      if (date && totalMQDs) {
        entries.push({
          category: 'Flight',
          description: `${origin} ${dest}`,
          origin,
          destination: dest,
          date,
          totalMiles,
          baseMiles: 0,
          bonusMiles: 0,
          totalMQDs,
          baseMQDs: totalMQDs,
          bonusMQDs: 0,
          status: 'Pending',
        });
      }
    } else {
      i++;
    }
  }

  return entries;
}

function parsePostedSection(lines: string[]): ParsedBlock[] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isEntryStart =
      /^MQD (Boost|Headstart):/.test(line) ||
      // Flight: "ATL SFO DL0531" or "CUN ATL DL0595"
      /^[A-Z]{3}\s+[A-Z]{3}\s+DL/.test(line) ||
      // Flight without flight number: "ATL CUN" followed by date or negative miles
      (/^[A-Z]{3}\s+[A-Z]{3}$/.test(line) &&
        i + 1 < lines.length &&
        (lines[i + 1].includes('Miles') || parseDate(lines[i + 1]) !== null)) ||
      // Cars & Stays
      (/rental|Delta\.com\/cars|Delta\.com\/hotels/i.test(line) && !line.startsWith('Bonus')) ||
      // Rollover
      /^Rollover MQDs/i.test(line) ||
      // Distance Flown marks a boundary — orphaned MQD entries follow
      /^Distance Flown/.test(line);

    if (isEntryStart && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const entries: ParsedBlock[] = [];
  for (const block of blocks) {
    const entry = parsePostedBlock(block);
    if (entry) entries.push(entry);
  }
  return entries;
}

function parsePostedBlock(block: string[]): ParsedBlock | null {
  const header = block[0];
  const fullText = block.join('\n');

  // Skip refunds
  if (fullText.includes('Refunded')) return null;
  // Skip pure mileage redemptions (negative miles, Certificate #, no MQDs)
  if (fullText.includes('Certificate #') && !fullText.includes('MQDs')) return null;

  let category = '';
  let description = header;
  let origin: string | undefined;
  let destination: string | undefined;
  let flightNumber: string | undefined;

  if (/^Distance Flown/.test(header)) {
    // Orphaned entry after a flight — look for Bonus MQDs line to determine category
    const bonusLine = block.find((l) => l.startsWith('Bonus MQDs:'));
    if (bonusLine) {
      if (bonusLine.includes('MQD Boost')) {
        category = 'MQD Boost';
        const cardMatch = bonusLine.match(/MQD Boost:\s*(.+?)\s*\$/);
        description = cardMatch ? cardMatch[1] : 'MQD Boost';
      } else if (bonusLine.includes('MQD Headstart')) {
        category = 'MQD Headstart';
        const cardMatch = bonusLine.match(/MQD Headstart:\s*(.+?)\s*\$/);
        description = cardMatch ? cardMatch[1] : 'MQD Headstart';
      } else {
        return null; // Unknown orphaned entry
      }
    } else {
      return null; // No MQD data in this block
    }
  } else if (/^MQD Boost:/.test(header)) {
    category = 'MQD Boost';
    description = header.replace('MQD Boost: ', '');
  } else if (/^MQD Headstart:/.test(header)) {
    category = 'MQD Headstart';
    description = header.replace('MQD Headstart: ', '');
  } else if (/^[A-Z]{3}\s+[A-Z]{3}/.test(header)) {
    category = 'Flight';
    const flightMatch = header.match(/^([A-Z]{3})\s+([A-Z]{3})\s*(DL\w+)?/);
    if (flightMatch) {
      origin = flightMatch[1];
      destination = flightMatch[2];
      flightNumber = flightMatch[3];
      description = header;
    }
  } else if (/rental|Delta\.com\/cars|Delta\.com\/hotels/i.test(header)) {
    category = 'Delta Cars & Stays';
    description = header;
  } else if (/^Rollover/i.test(header)) {
    category = 'Rollover MQDs';
    description = header;
  } else {
    category = 'Other';
  }

  let date = '';
  let postedDate: string | undefined;
  let totalMiles = 0;
  let baseMiles = 0;
  let bonusMiles = 0;
  let totalMQDs = 0;
  let baseMQDs = 0;
  let bonusMQDs = 0;
  let ticketNumber: string | undefined;

  for (let i = 1; i < block.length; i++) {
    const line = block[i];

    if (!date) {
      const d = parseDate(line);
      if (d && !line.startsWith('Posted')) {
        date = d;
      }
    }

    if (line.startsWith('Posted')) {
      const d = parseDate(line);
      if (d) postedDate = d;
    }

    if (line.startsWith('Ticket#') || line.includes('Ticket#')) {
      const tm = line.match(/Ticket#\s*(\d+)/);
      if (tm) ticketNumber = tm[1];
    }

    // After normalization, "Base Miles 1,375" may be on one line or "Base Miles" + "1,375" on two
    if (/^Base Miles/.test(line)) {
      const val = parseMoney(line);
      if (val) {
        baseMiles = val;
      } else if (i + 1 < block.length) {
        baseMiles = parseMoney(block[i + 1]);
      }
    }
    if (line.startsWith('Bonus:') || (line.startsWith('Bonus') && line.includes('Medallion'))) {
      const val = parseMoney(line);
      if (val) {
        bonusMiles = val;
      } else if (i + 1 < block.length) {
        bonusMiles = parseMoney(block[i + 1]);
      }
    }
    if (/^Total Miles/.test(line)) {
      const val = parseMoney(line);
      if (val) {
        totalMiles = val;
      } else if (i + 1 < block.length) {
        totalMiles = parseMoney(block[i + 1]);
      }
    }

    if (/^Base MQDs/.test(line)) {
      const val = parseMoney(line);
      if (val) {
        baseMQDs = val;
      } else if (i + 1 < block.length) {
        baseMQDs = parseMoney(block[i + 1]);
      }
    }
    if (line.startsWith('Bonus MQDs:')) {
      const val = parseMoney(line);
      if (val) {
        bonusMQDs = val;
      } else if (i + 1 < block.length) {
        bonusMQDs = parseMoney(block[i + 1]);
      }
    }
    if (/^Total MQDs/.test(line) && !totalMQDs) {
      const val = parseMoney(line);
      if (val) {
        totalMQDs = val;
      } else if (i + 1 < block.length) {
        totalMQDs = parseMoney(block[i + 1]);
      }
    }

    // Top-level summary line: "$27 MQDs" or "$275 MQDs"
    if (line.includes('MQDs') && /\$[-,\d]+\s*MQDs/.test(line) && !line.startsWith('Bonus') && !line.startsWith('Base') && !/^Total/.test(line)) {
      const topMqd = parseDollarAmount(line);
      if (topMqd && !totalMQDs) totalMQDs = topMqd;
    }

    // Top-level miles: "3,025 Miles"
    if (/^[-,\d]+\s+Miles/.test(line) && !totalMiles) {
      totalMiles = parseMiles(line);
    }
  }

  // For orphaned entries (Distance Flown blocks), use postedDate as date
  if (!date && postedDate) date = postedDate;

  // Skip entries with no MQDs and negative miles (pure redemptions)
  if (!totalMQDs && totalMiles <= 0) return null;
  if (!date) return null;

  return {
    category,
    description,
    origin,
    destination,
    flightNumber,
    date,
    postedDate,
    totalMiles,
    baseMiles,
    bonusMiles,
    totalMQDs,
    baseMQDs,
    bonusMQDs,
    ticketNumber,
    status: 'Complete',
  };
}

export async function parseDeltaPDF(file: File, filterYear?: number): Promise<MQDEntry[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join('\n');
    fullText += pageText + '\n';
  }

  let entries = parseRawText(fullText);
  if (filterYear) {
    const yearStr = String(filterYear);
    entries = entries.filter((e) => e.date.startsWith(yearStr));
  }
  return entries;
}

export function parseRawText(text: string): MQDEntry[] {
  const lines = normalizeText(text);

  // Find Pending / Posted boundaries
  let pendingStart = -1;
  let postedStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'Pending' && pendingStart === -1) {
      pendingStart = i + 1;
    }
    // "Posted" appears as a section header and also inside entries ("Posted Mar 6, 2026").
    // The section header "Posted" is a standalone word, not followed by a date on the same line.
    if (lines[i] === 'Posted' && postedStart === -1) {
      postedStart = i + 1;
    }
  }

  const allBlocks: ParsedBlock[] = [];

  if (pendingStart >= 0) {
    const end = postedStart >= 0 ? postedStart - 1 : lines.length;
    // Skip the description paragraph after "Pending"
    let actualStart = pendingStart;
    for (let i = pendingStart; i < end; i++) {
      if (AIRPORT_CODE.test(lines[i]) || /^[A-Z]{3}\s+[A-Z]{3}/.test(lines[i])) {
        actualStart = i;
        break;
      }
    }
    allBlocks.push(...parsePendingSection(lines.slice(actualStart, end)));
  }

  if (postedStart >= 0) {
    allBlocks.push(...parsePostedSection(lines.slice(postedStart)));
  }

  return allBlocks.map((b) =>
    createEntry({
      date: b.date,
      category: b.category,
      description: b.description,
      origin: b.origin,
      destination: b.destination,
      flightNumber: b.flightNumber,
      baseMiles: b.baseMiles,
      bonusMiles: b.bonusMiles,
      totalMiles: b.totalMiles,
      baseMQDs: b.baseMQDs,
      bonusMQDs: b.bonusMQDs,
      totalMQDs: b.totalMQDs,
      ticketNumber: b.ticketNumber,
      postedDate: b.postedDate,
      status: b.status,
    })
  );
}
