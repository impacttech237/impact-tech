/* ------------------------------------------------------------------
   Génération PDF minimaliste pour Cloudflare Workers (pas de DOM).
   Construit un PDF 1.4 directement en octets.
   Usage : contrats signés avec mention + signature + horodatage.
------------------------------------------------------------------- */

const FONT_SIZE = 11;
const LINE_HEIGHT = 14;
const MARGIN_LEFT = 50;
const MARGIN_TOP = 750;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_RIGHT = 545;
const USABLE_WIDTH = MARGIN_RIGHT - MARGIN_LEFT;

function escPdf(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\x00-\x1f]/g, "");
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const word of words) {
      if (current.length + word.length + 1 > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = current ? current + " " + word : word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

interface ContractPdfOptions {
  title: string;
  content: string;
  clientName: string;
  approvalText: string;
  signatureB64: string;
  signedAt: string;
  ipAddress: string;
}

export function generateContractPdf(options: ContractPdfOptions): Uint8Array {
  const objects: string[] = [];
  const offsets: number[] = [];
  let objCount = 0;

  function addObj(content: string): number {
    objCount++;
    objects.push(content);
    return objCount;
  }

  // Obj 1: Catalog
  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  // Obj 2: Pages (placeholder, updated later)
  addObj(""); // placeholder

  // Obj 3: Font (Helvetica)
  addObj(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj"
  );

  // Obj 4: Bold font
  addObj(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj"
  );

  // Build content lines across pages
  const maxCharsPerLine = Math.floor(USABLE_WIDTH / (FONT_SIZE * 0.5));
  const titleLines = [options.title];
  const contentLines = wrapText(options.content, maxCharsPerLine);

  // Signature block
  const sigLines = [
    "",
    "─────────────────────────────────────────",
    "",
    `${options.approvalText}`,
    "",
    `Signé par : ${options.clientName}`,
    `Date : ${options.signedAt}`,
    `IP : ${options.ipAddress}`,
    "",
    "[Signature manuscrite ci-dessous]",
  ];

  const allLines = [...contentLines, ...sigLines];
  const linesPerPage = Math.floor((MARGIN_TOP - 80) / LINE_HEIGHT);

  // Split into pages
  const pages: string[][] = [];
  let pageLines: string[] = [];
  for (const line of allLines) {
    pageLines.push(line);
    if (pageLines.length >= linesPerPage) {
      pages.push(pageLines);
      pageLines = [];
    }
  }
  if (pageLines.length > 0) pages.push(pageLines);
  if (pages.length === 0) pages.push([]);

  // Decode signature image
  let sigImageObj = 0;
  let sigWidth = 200;
  let sigHeight = 80;
  const sigB64 = options.signatureB64.replace(/^data:image\/\w+;base64,/, "");
  let sigBytes: Uint8Array | null = null;
  try {
    const raw = atob(sigB64);
    sigBytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) sigBytes[i] = raw.charCodeAt(i);

    // Try to read PNG dimensions
    if (sigBytes[0] === 0x89 && sigBytes[1] === 0x50) {
      const dv = new DataView(sigBytes.buffer);
      sigWidth = dv.getUint32(16);
      sigHeight = dv.getUint32(20);
    }
  } catch {
    sigBytes = null;
  }

  // Add signature image object if we have the data
  if (sigBytes) {
    objCount++;
    sigImageObj = objCount;
    const imgStream =
      `${sigImageObj} 0 obj\n` +
      `<< /Type /XObject /Subtype /Image /Width ${sigWidth} /Height ${sigHeight} ` +
      `/Filter /FlateDecode /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
      `/Length ${sigBytes.length} >>\n` +
      `stream\n`;
    objects.push(imgStream + "BINARY_PLACEHOLDER\nendstream\nendobj");
  }

  // Create page objects
  const pageObjIds: number[] = [];
  for (let p = 0; p < pages.length; p++) {
    const isLastPage = p === pages.length - 1;
    const lines = pages[p];

    // Build content stream
    let stream = "BT\n";

    // Title on first page
    if (p === 0) {
      stream += `/F2 16 Tf\n${MARGIN_LEFT} ${MARGIN_TOP} Td\n(${escPdf(options.title)}) Tj\n`;
      stream += `/F1 ${FONT_SIZE} Tf\n0 -${LINE_HEIGHT * 2} Td\n`;
    } else {
      stream += `/F1 ${FONT_SIZE} Tf\n${MARGIN_LEFT} ${MARGIN_TOP} Td\n`;
    }

    for (const line of lines) {
      if (line.startsWith("─")) {
        stream += `/F1 8 Tf\n(${escPdf(line)}) Tj\n0 -${LINE_HEIGHT} Td\n/F1 ${FONT_SIZE} Tf\n`;
      } else if (line === options.approvalText) {
        stream += `/F2 12 Tf\n(${escPdf(line)}) Tj\n0 -${LINE_HEIGHT} Td\n/F1 ${FONT_SIZE} Tf\n`;
      } else {
        stream += `(${escPdf(line)}) Tj\n0 -${LINE_HEIGHT} Td\n`;
      }
    }
    stream += "ET\n";

    // Signature image on last page
    if (isLastPage && sigImageObj) {
      const imgW = Math.min(200, sigWidth);
      const imgH = Math.round((imgW / sigWidth) * sigHeight);
      const imgY = Math.max(60, MARGIN_TOP - (p === 0 ? LINE_HEIGHT * 2 : 0) - lines.length * LINE_HEIGHT - imgH - 10);
      stream += `q ${imgW} 0 0 ${imgH} ${MARGIN_LEFT} ${imgY} cm /Sig Do Q\n`;
    }

    const streamBytes = new TextEncoder().encode(stream);

    // Content stream object
    objCount++;
    const streamObjId = objCount;
    objects.push(
      `${streamObjId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream\nendobj`
    );

    // Page object
    objCount++;
    const pageObjId = objCount;
    pageObjIds.push(pageObjId);

    let resources = `/Font << /F1 3 0 R /F2 4 0 R >>`;
    if (isLastPage && sigImageObj) {
      resources += ` /XObject << /Sig ${sigImageObj} 0 R >>`;
    }

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Contents ${streamObjId} 0 R /Resources << ${resources} >> >>\nendobj`
    );
  }

  // Update pages object
  const kids = pageObjIds.map((id) => `${id} 0 R`).join(" ");
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageObjIds.length} >>\nendobj`;

  // Build PDF
  let pdf = "%PDF-1.4\n%âãÏÓ\n\n";
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    if (objects[i].includes("BINARY_PLACEHOLDER") && sigBytes) {
      const parts = objects[i].split("BINARY_PLACEHOLDER");
      pdf += parts[0];
      // For simplicity with binary, we'll use hex encoding instead
      // Re-encode as ASCII hex
      const hexStr = Array.from(sigBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      pdf = pdf.replace("/FlateDecode", "/ASCIIHexDecode");
      pdf = pdf.replace(`/Length ${sigBytes.length}`, `/Length ${hexStr.length + 1}`);
      pdf += hexStr + ">";
      pdf += parts[1].replace("\n", "");
      pdf += "\n";
    } else {
      pdf += objects[i] + "\n\n";
    }
  }

  // xref
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objCount + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += String(off).padStart(10, "0") + " 00000 n \n";
  }

  // trailer
  pdf += `trailer\n<< /Size ${objCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export async function storeContractPdf(
  env: any,
  projectId: number,
  documentId: number,
  pdfBytes: Uint8Array
): Promise<string> {
  const key = `contracts/${projectId}/${documentId}-${Date.now()}.pdf`;
  await env.MEDIA.put(key, pdfBytes, {
    httpMetadata: {
      contentType: "application/pdf",
      cacheControl: "private, max-age=31536000",
    },
  });
  return key;
}
