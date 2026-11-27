# Rend en PNG la page du PDF la plus probable pour un repère : python scripts/page-fait.py <id_fait> -> sources/ocr/img/<id>.png
import sys, os, re, json, glob, warnings
warnings.filterwarnings('ignore')
import pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fid = sys.argv[1]; tid = fid.split('.')[0]
faits = {}
for f in glob.glob(os.path.join(racine, 'data', 'faits', tid + '.json')):
    for x in json.load(open(f, encoding='utf-8')): faits[x['id']] = x
fa = faits[fid]
txt = open(os.path.join(racine, 'sources', 'ocr', tid + '.txt'), encoding='utf-8').read()
pages = re.split(r'=== page (\d+) ===\n', txt); pg = {int(pages[i]): pages[i + 1] for i in range(1, len(pages), 2)}
import unicodedata
def sa(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
kw = set(w[:6] for w in re.findall(r'[a-z]{5,}', sa(fa['enonce'] + ' ' + (fa.get('valeur_texte') or ''))))
sc = {}
for p, t in pg.items():
    ws = set(w[:6] for w in re.findall(r'[a-z]{4,}', sa(t))); sc[p] = len(kw & ws) / max(1, len(kw))
best = sorted(sc, key=lambda p: -sc[p])[:2]
m = json.load(open(os.path.join(racine, 'data', 'pdf-map.json'), encoding='utf-8'))
doc = pymupdf.open(os.path.join(os.path.expanduser('~'), m[tid]))
os.makedirs(os.path.join(racine, 'sources', 'ocr', 'img'), exist_ok=True)
out = os.path.join(racine, 'sources', 'ocr', 'img', fid + '.png')
doc[best[0] - 1].get_pixmap(dpi=110).save(out)
print(fid, 'page', best[0], '| enoncé:', fa['enonce'][:90], '| valeur:', fa['valeur_texte'][:60], '|', out)
