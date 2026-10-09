/* ------------------------------------------------------------------
   PDF du portail (pdf-lib, pur JS, compatible Workers).
   - contrat rédigé dans l'admin -> PDF propre (accents, pagination)
   - document uploadé (PDF / image / Word) + signature(s) -> PDF signé :
     tampon en pied de chaque page + page « Certificat de signature »
     (empreinte SHA-256 du document d'origine, date, IP, appareil).
   - devis / factures / reçus.
------------------------------------------------------------------- */
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

const RED = rgb(0.753, 0.125, 0.169); // #C0202B
const INK = rgb(0.1, 0.1, 0.09);
const MUTED = rgb(0.42, 0.42, 0.4);
const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;

/* Remplace les caractères que Helvetica (WinAnsi) ne sait pas encoder. */
function makeSanitizer(font: PDFFont) {
  const cache = new Map<string, string>();
  const replacements: Record<string, string> = { "→": "->", "←": "<-", "✓": "v", "✔": "v", "─": "-", " ": " ", " ": " ", " ": " " };
  return (text: string) =>
    Array.from(String(text ?? ""))
      .map((ch) => {
        if (ch === "\n") return ch;
        if (cache.has(ch)) return cache.get(ch)!;
        let out = replacements[ch];
        if (out === undefined) {
          try {
            font.encodeText(ch);
            out = ch;
          } catch {
            out = "";
          }
        }
        cache.set(ch, out);
        return out;
      })
      .join("");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of para.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        // mot plus long qu'une ligne : coupe dure
        let w = word;
        while (font.widthOfTextAtSize(w, size) > maxWidth && w.length > 1) {
          let cut = w.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxWidth) cut--;
          lines.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        current = w;
      }
    }
    lines.push(current);
  }
  return lines;
}

interface Writer {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  clean: (t: string) => string;
}

async function newWriter(doc?: PDFDocument): Promise<Writer> {
  const d = doc || (await PDFDocument.create());
  const font = await d.embedFont(StandardFonts.Helvetica);
  const bold = await d.embedFont(StandardFonts.HelveticaBold);
  const page = d.addPage(A4);
  return { doc: d, page, y: A4[1] - MARGIN, font, bold, clean: makeSanitizer(font) };
}

function ensureSpace(w: Writer, needed: number) {
  if (w.y - needed < MARGIN + 20) {
    w.page = w.doc.addPage(A4);
    w.y = A4[1] - MARGIN;
  }
}

function writeText(w: Writer, text: string, opts: { size?: number; bold?: boolean; color?: any; gap?: number } = {}) {
  const size = opts.size ?? 10.5;
  const font = opts.bold ? w.bold : w.font;
  const lineHeight = size * 1.45;
  for (const line of wrap(w.clean(text), font, size, A4[0] - MARGIN * 2)) {
    ensureSpace(w, lineHeight);
    if (line) w.page.drawText(line, { x: MARGIN, y: w.y - size, size, font, color: opts.color ?? INK });
    w.y -= lineHeight;
  }
  w.y -= opts.gap ?? 0;
}

function brandHeader(w: Writer, subtitle: string) {
  w.page.drawText("impact", { x: MARGIN, y: w.y - 16, size: 16, font: w.bold, color: INK });
  const wImpact = w.bold.widthOfTextAtSize("impact", 16);
  w.page.drawText(".", { x: MARGIN + wImpact, y: w.y - 16, size: 16, font: w.bold, color: RED });
  w.page.drawText("Tech", { x: MARGIN + wImpact + w.bold.widthOfTextAtSize(".", 16), y: w.y - 16, size: 16, font: w.bold, color: INK });
  const sub = w.clean(subtitle);
  w.page.drawText(sub, { x: A4[0] - MARGIN - w.font.widthOfTextAtSize(sub, 9), y: w.y - 14, size: 9, font: w.font, color: MUTED });
  w.y -= 30;
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: A4[0] - MARGIN, y: w.y }, thickness: 1, color: RED });
  w.y -= 20;
}

/* ── Contrat rédigé (texte) -> PDF ── */
export async function textDocumentPdf(title: string, content: string): Promise<Uint8Array> {
  const w = await newWriter();
  brandHeader(w, "impacttech237.com");
  writeText(w, title, { size: 17, bold: true, gap: 10 });
  for (const block of String(content || "").split(/\n{2,}/)) {
    const isHeading = /^#{1,3}\s/.test(block) || (/^[A-ZÀ-Ý0-9 ,.'’:-]{6,80}$/.test(block.trim()) && !block.includes("\n"));
    if (isHeading) writeText(w, block.replace(/^#{1,3}\s/, ""), { size: 12, bold: true, gap: 4 });
    else writeText(w, block.replace(/^\s*[-*]\s/gm, "• "), { gap: 8 });
  }
  return w.doc.save();
}

export interface SignerInfo {
  role: "client" | "admin";
  name: string;
  approval?: string;
  signedAt: string; // texte déjà formaté
  ip?: string;
  userAgent?: string;
  signaturePng: Uint8Array | null;
}

/* ── Document d'origine + signatures -> PDF signé ── */
export async function signedDocumentPdf(params: {
  title: string;
  original: Uint8Array | null; // octets du fichier uploadé, ou null si contrat texte
  originalName?: string;
  originalMime?: string;
  textContent?: string;
  sha256: string;
  signers: SignerInfo[];
}): Promise<Uint8Array> {
  let doc: PDFDocument;
  const mime = (params.originalMime || "").toLowerCase();

  if (params.original && mime === "application/pdf") {
    doc = await PDFDocument.load(params.original, { ignoreEncryption: true });
  } else if (params.original && /^image\/(png|jpe?g)$/.test(mime)) {
    doc = await PDFDocument.create();
    const img = mime.includes("png") ? await doc.embedPng(params.original) : await doc.embedJpg(params.original);
    const page = doc.addPage(A4);
    const scale = Math.min((A4[0] - 60) / img.width, (A4[1] - 60) / img.height, 1);
    page.drawImage(img, {
      x: (A4[0] - img.width * scale) / 2,
      y: (A4[1] - img.height * scale) / 2,
      width: img.width * scale,
      height: img.height * scale,
    });
  } else if (params.original) {
    // Word, etc. : on ne peut pas réécrire le fichier, le certificat référence
    // son empreinte SHA-256 (preuve que c'est bien ce fichier qui a été signé).
    doc = await PDFDocument.create();
    const w = await newWriter(doc);
    brandHeader(w, "Document signé");
    writeText(w, params.title, { size: 17, bold: true, gap: 10 });
    writeText(w, `Fichier signé : ${params.originalName || "document"}`, { gap: 4 });
    writeText(w, "Le fichier d'origine est conservé tel quel dans l'espace client. Son empreinte SHA-256 figure sur le certificat ci-après : toute modification du fichier changerait cette empreinte.", { color: MUTED });
  } else {
    doc = await PDFDocument.load(await textDocumentPdf(params.title, params.textContent || ""));
  }

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = makeSanitizer(font);

  // Tampon en pied de chaque page existante.
  const client = params.signers.find((s) => s.role === "client");
  const pages = doc.getPages();
  const stamp = clean(
    `Signé électroniquement${client ? ` par ${client.name} le ${client.signedAt}` : ""} — Impact Tech — empreinte ${params.sha256.slice(0, 16)}…`
  );
  pages.forEach((p, i) => {
    const { width } = p.getSize();
    const text = `${stamp}  (${i + 1}/${pages.length})`;
    p.drawText(text, { x: 24, y: 14, size: 6.5, font, color: MUTED, maxWidth: width - 48 });
  });

  // Page certificat.
  const w: Writer = { doc, page: doc.addPage(A4), y: A4[1] - MARGIN, font, bold, clean };
  brandHeader(w, "Certificat de signature électronique");
  writeText(w, params.title, { size: 16, bold: true, gap: 6 });
  writeText(w, `Empreinte SHA-256 du document : ${params.sha256}`, { size: 8.5, color: MUTED, gap: 14 });

  for (const s of params.signers) {
    ensureSpace(w, 170);
    writeText(w, s.role === "client" ? "Signature du client" : "Signature d'Impact Tech", { size: 12, bold: true, gap: 2 });
    writeText(w, `Nom : ${s.name}`);
    if (s.approval) writeText(w, `Mention : « ${s.approval} »`);
    writeText(w, `Date : ${s.signedAt}`);
    if (s.ip) writeText(w, `Adresse IP : ${s.ip}`, { color: MUTED });
    if (s.userAgent) writeText(w, `Appareil : ${s.userAgent.slice(0, 140)}`, { size: 8, color: MUTED });
    if (s.signaturePng) {
      try {
        const img = await doc.embedPng(s.signaturePng);
        const width = Math.min(200, img.width);
        const height = (width / img.width) * img.height;
        ensureSpace(w, height + 10);
        w.page.drawRectangle({ x: MARGIN, y: w.y - height - 6, width: width + 12, height: height + 12, borderColor: rgb(0.85, 0.85, 0.83), borderWidth: 1 });
        w.page.drawImage(img, { x: MARGIN + 6, y: w.y - height, width, height });
        w.y -= height + 18;
      } catch {
        writeText(w, "[signature manuscrite non lisible]", { color: MUTED });
      }
    }
    w.y -= 10;
  }

  writeText(
    w,
    "Ce certificat atteste que le document identifié par l'empreinte ci-dessus a été lu et approuvé par les signataires, depuis leur espace sécurisé (accès par code à usage unique). Les données de signature sont conservées par Impact Tech.",
    { size: 8.5, color: MUTED }
  );
  return doc.save();
}

/* ── Devis / facture / reçu ── */
export async function invoicePdf(params: {
  kind: "devis" | "facture" | "recu";
  number: string;
  title: string;
  date: string;
  dueDate?: string | null;
  client: { name: string; company?: string; email?: string; phone?: string };
  items: { label: string; qty: number; unit: number }[];
  amount: number;
  currency: string;
  notes?: string;
  paidAt?: string | null;
  issuer: { phone?: string; email?: string };
}): Promise<Uint8Array> {
  const label = params.kind === "devis" ? "DEVIS" : params.kind === "recu" ? "REÇU DE PAIEMENT" : "FACTURE";
  const w = await newWriter();
  brandHeader(w, `${label} n° ${params.number}`);

  const money = (n: number) =>
    `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${params.currency === "EUR" ? "€" : "FCFA"}`;

  writeText(w, label, { size: 20, bold: true, color: RED, gap: 2 });
  writeText(w, params.title, { size: 12, bold: true, gap: 10 });
  writeText(w, `Date : ${params.date}${params.dueDate ? `   ·   Échéance : ${params.dueDate}` : ""}`, { color: MUTED, gap: 10 });

  writeText(w, "Client", { bold: true });
  writeText(w, [params.client.name, params.client.company, params.client.email, params.client.phone].filter(Boolean).join("  ·  "), { gap: 14 });

  // Tableau des lignes
  const colX = [MARGIN, A4[0] - MARGIN - 210, A4[0] - MARGIN - 140, A4[0] - MARGIN - 70];
  const headerY = w.y;
  w.page.drawRectangle({ x: MARGIN, y: headerY - 18, width: A4[0] - MARGIN * 2, height: 18, color: rgb(0.95, 0.94, 0.92) });
  ["Désignation", "Qté", "Prix unit.", "Total"].forEach((h, i) =>
    w.page.drawText(w.clean(h), { x: colX[i] + 4, y: headerY - 13, size: 9, font: w.bold, color: INK })
  );
  w.y -= 26;
  for (const it of params.items) {
    const lines = wrap(w.clean(it.label), w.font, 9.5, colX[1] - colX[0] - 10);
    ensureSpace(w, lines.length * 13 + 6);
    lines.forEach((l, i) => w.page.drawText(l, { x: colX[0] + 4, y: w.y - 10 - i * 13, size: 9.5, font: w.font, color: INK }));
    w.page.drawText(String(it.qty), { x: colX[1] + 4, y: w.y - 10, size: 9.5, font: w.font, color: INK });
    w.page.drawText(w.clean(money(it.unit)), { x: colX[2] + 4, y: w.y - 10, size: 9.5, font: w.font, color: INK });
    w.page.drawText(w.clean(money(it.qty * it.unit)), { x: colX[3] + 4, y: w.y - 10, size: 9.5, font: w.font, color: INK });
    w.y -= lines.length * 13 + 8;
  }
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: A4[0] - MARGIN, y: w.y }, thickness: 0.5, color: MUTED });
  w.y -= 8;
  const total = w.clean(`TOTAL : ${money(params.amount)}`);
  w.page.drawText(total, { x: A4[0] - MARGIN - w.bold.widthOfTextAtSize(total, 13), y: w.y - 14, size: 13, font: w.bold, color: INK });
  w.y -= 34;

  if (params.kind === "recu" && params.paidAt) writeText(w, `Payé le ${params.paidAt} par Mobile Money. Merci pour votre confiance !`, { bold: true, color: rgb(0.13, 0.55, 0.3), gap: 10 });
  if (params.kind === "devis") writeText(w, "Paiement à la livraison uniquement : vous ne payez que lorsque vous êtes satisfait du résultat.", { color: MUTED, gap: 8 });
  if (params.notes) writeText(w, params.notes, { gap: 8 });
  writeText(w, `Impact Tech — impacttech237.com${params.issuer.phone ? ` — ${params.issuer.phone}` : ""}${params.issuer.email ? ` — ${params.issuer.email}` : ""}`, { size: 8.5, color: MUTED });
  return w.doc.save();
}
