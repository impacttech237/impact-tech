# python scripts/lot.py <texte...> [--L=800] : repères non relus (role/definition/liste) + meilleure fenêtre OCR (pondérée IDF)
import sys, os, re, json, io, unicodedata, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOP = set('dans pour avec sans leur leurs cette cet ces sont être etre fait faire plus moins tout toute tous toutes ainsi entre apres avant selon sous vers chez dont elle elles ils celui celle ceux comme mais donc aussi peut doit doivent peuvent autre autres chaque quelque lors lorsque quand notamment egalement soit'.split())
def sa(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
def stems(s): return [w[:5] for w in re.findall(r"[a-z0-9]+", sa(s)) if w not in STOP and (len(w) >= 5 or w.isdigit())]
L = int(([x[4:] for x in sys.argv if x.startswith('--L=')] or [800])[0])
rel = set(json.load(open(f'{R}/data/releve.json', encoding='utf-8'))['faits'])
for tid in [x for x in sys.argv[1:] if not x.startswith('--')]:
    raw = open(f'{R}/sources/ocr/{tid}.txt', encoding='utf-8').read(); rs = sa(raw)
    wins = [(st, set(stems(rs[st:st + 1300]))) for st in range(0, max(1, len(rs) - 300), 250)]
    df = {}
    for _, W in wins:
        for w in W: df[w] = df.get(w, 0) + 1
    pg = [(m.start(), int(m.group(1))) for m in re.finditer(r'=== page (\d+) ===', raw)]
    print('########', tid)
    for f in json.load(open(f'{R}/data/faits/{tid}.json', encoding='utf-8')):
        if f['id'] in rel or f['type'] not in os.environ.get('TYPES','role,definition,liste').split(','): continue
        ns = set(stems(f['enonce'] + ' ' + f['valeur_texte']))
        wt = {w: math.log(1 + len(wins) / (1 + df.get(w, 0))) for w in ns}; tot = sum(wt.values()) or 1
        best = max(wins, key=lambda x: sum(wt[w] for w in ns if w in x[1]))
        c = sum(wt[w] for w in ns if w in best[1]) / tot
        p = 1
        for s0, n in pg:
            if s0 <= best[0]: p = n
        print(f"## {f['id']} [{f.get('article')}] {f['enonce']}\n  V: {f['valeur_texte'][:420]}\n  >> p{p} ({c:.2f}) …{re.sub(r'\s+', ' ', raw[best[0]:best[0] + L])}")
