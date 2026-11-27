# python scripts/fenetre.py <id> [id...] [--L=900] : le repère + la fenêtre OCR qui le couvre le mieux
import sys, os, re, json, io, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOP = set('dans pour avec sans leur leurs cette cet ces sont être etre fait faire plus moins tout toute tous toutes ainsi entre apres avant selon sous vers chez dont elle elles ils celui celle ceux comme mais donc aussi peut doit doivent peuvent autre autres chaque quelque lors lorsque quand notamment egalement soit'.split())
def sa(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
def stems(s): return [w[:5] for w in re.findall(r"[a-z0-9]+", sa(s)) if w not in STOP and (len(w) >= 5 or w.isdigit())]
L = int(([x[4:] for x in sys.argv if x.startswith('--L=')] or [900])[0])
for fid in [x for x in sys.argv[1:] if not x.startswith('--')]:
    tid = fid.split('.')[0]
    f = next(x for x in json.load(open(f'{R}/data/faits/{tid}.json', encoding='utf-8')) if x['id'] == fid)
    raw = open(f'{R}/sources/ocr/{tid}.txt', encoding='utf-8').read(); rs = sa(raw)
    ns = set(stems(f['enonce'] + ' ' + f['valeur_texte'])); best = (0, 0)
    wins = [(st, set(stems(rs[st:st + 1500]))) for st in range(0, max(1, len(rs) - 400), 250)]
    import math
    wt = {w: math.log(1 + len(wins) / (1 + sum(w in W for _, W in wins))) for w in ns}
    tot = sum(wt.values()) or 1
    for st, W in wins:
        c = sum(wt[w] for w in ns if w in W) / tot
        if c > best[0]: best = (c, st)
    st = best[1]
    pg = 1
    for m in re.finditer(r'=== page (\d+) ===', raw):
        if m.start() <= st: pg = int(m.group(1))
    print(f"### {fid} [{f.get('article')}] E: {f['enonce']}\n  V: {f['valeur_texte'][:400]}\n  >> p{pg} ({best[0]:.2f}) …{re.sub(chr(92)+'s+', ' ', raw[st:st + L])}\n")
