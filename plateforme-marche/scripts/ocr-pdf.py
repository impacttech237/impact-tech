# OCR des PDF scannés (moteur Windows, français) : python scripts/ocr-pdf.py <id> ... -> sources/ocr/<id>.txt
import sys, os, json, asyncio, io, warnings
warnings.filterwarnings('ignore')
import pymupdf
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.globalization import Language
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.storage.streams import InMemoryRandomAccessStream, DataWriter

racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
carte = json.load(open(os.path.join(racine, 'data', 'pdf-map.json'), encoding='utf-8'))
home = os.path.expanduser('~')
sortie = os.path.join(racine, 'sources', 'ocr'); os.makedirs(sortie, exist_ok=True)
engine = OcrEngine.try_create_from_language(Language('fr-FR'))

async def ocr_png(png):
    st = InMemoryRandomAccessStream(); w = DataWriter(st); w.write_bytes(png); await w.store_async(); st.seek(0)
    dec = await BitmapDecoder.create_async(st); bmp = await dec.get_software_bitmap_async()
    r = await engine.recognize_async(bmp)
    return '\n'.join(l.text for l in r.lines)

async def traiter(id_):
    fp = os.path.join(home, carte[id_]); doc = pymupdf.open(fp); out = []
    for i, page in enumerate(doc):
        t = page.get_text().strip()
        if len(t) > 200: out.append(f'=== page {i+1} ===\n{t}'); continue
        pix = page.get_pixmap(dpi=220); txt = await ocr_png(pix.tobytes('png'))
        out.append(f'=== page {i+1} ===\n{txt}')
    open(os.path.join(sortie, id_ + '.txt'), 'w', encoding='utf-8').write('\n'.join(out))
    return len(doc)

async def main(ids):
    for id_ in ids:
        if os.path.exists(os.path.join(sortie, id_ + '.txt')): continue
        n = await traiter(id_); print(id_, n, 'pages', flush=True)
asyncio.run(main(sys.argv[1:] or list(carte)))
