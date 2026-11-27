# Affiche, pour chaque repère d'un texte, l'extrait OCR autour de sa valeur : python scripts/contexte-faits.py <id_texte> [debut] [fin]
import sys, os, re, json, io, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tid = sys.argv[1]; a = int(sys.argv[2]) if len(sys.argv) > 2 else 0; b = int(sys.argv[3]) if len(sys.argv) > 3 else 999
faits = json.load(open(os.path.join(racine, 'data', 'faits', tid + '.json'), encoding='utf-8'))
ctl = json.load(open(os.path.join(racine, 'data', 'controle.json'), encoding='utf-8'))['faits']
raw = open(os.path.join(racine, 'sources', 'ocr', tid + '.txt'), encoding='utf-8').read()
pages = [(m.start(), int(m.group(1))) for m in re.finditer(r'=== page (\d+) ===', raw)]
def page_de(i):
    p = 1
    for s, n in pages:
        if s <= i: p = n
    return p
def sa(s): return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
for k, f in enumerate(faits):
    if k < a or k >= b: continue
    c = ctl.get(f['id'], {}); pos = c.get('p')
    head = f"[{k}] {f['id'].split('.',1)[1]} | {f.get('article')} | {f['enonce'][:100]} => {f['valeur_texte'][:110]} | auto={c.get('s')}"
    if pos is None or f['type'] in ('piege',):
        print(head); continue
    i = int(pos * len(sa(raw)))
    ex = re.sub(r'\s+', ' ', raw[max(0, i - 160): i + 260])
    print(head); print('    p.%d : …%s…' % (page_de(i), ex))
