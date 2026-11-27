# python scripts/couverture-roles.py <texte|all> : pour chaque rôle/définition/liste non relu, part des mots de l'énoncé retrouvés
# dans le texte OCR des articles cités (jusqu'à l'article suivant) ; liste les mots absents.
import sys, os, re, json, io, glob, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rel = set(json.load(open(f'{R}/data/releve.json', encoding='utf-8'))['faits'])
STOP = set('dans pour avec sans leur leurs cette cet ces sont être etre fait faire plus moins tout toute tous toutes ainsi entre apres avant selon sous vers chez dont elle elles ils celui celle ceux comme mais donc aussi peut doit doivent peuvent autre autres chaque quelque lors lorsque ainsi quand dont notamment egalement soit'.split())
def sa(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
def stems(s):
    out = []
    for w in re.findall(r"[a-z0-9]+", sa(s)):
        if w in STOP: continue
        if len(w) >= 5 or re.fullmatch(r'\d+', w): out.append(w[:5])
    return out
def span(raw, rawsa, n):
    pat = r'(?:article|art\.?)\s*' + (r'(?:1\s*(?:er|°)?|premier)' if n == '1' else re.escape(n)) + r'\b'
    res = ''
    for m in list(re.finditer(pat, rawsa))[:3]:
        nxt = re.search(r'(?:article|art\.?)\s*\d+\s*[.\-–:]', rawsa[m.end():])
        end = m.end() + (nxt.start() if nxt else 3000)
        res += ' ' + rawsa[m.start():min(end, m.start() + 7000)]
    return res
def nums(a):
    out = []
    for x in re.findall(r'(\d+)\s*-\s*(\d+)|(\d+)', a or ''):
        if x[0]:
            lo, hi = int(x[0]), int(x[1]); out += [str(i) for i in range(lo, min(hi, lo + 14) + 1)]
        elif x[2]: out.append(x[2])
    return list(dict.fromkeys(out))
tids = [sys.argv[1]] if sys.argv[1] != 'all' else [os.path.basename(p)[:-5] for p in sorted(glob.glob(f'{R}/data/faits/*.json'))]
for tid in tids:
    p = f'{R}/sources/ocr/{tid}.txt'
    if not os.path.exists(p): continue
    raw = open(p, encoding='utf-8').read(); rawsa = sa(raw)
    for f in json.load(open(f'{R}/data/faits/{tid}.json', encoding='utf-8')):
        if f['id'] in rel or f['type'] not in ('role', 'definition', 'liste'): continue
        need = stems(f['enonce'] + ' ' + f['valeur_texte']); ns = set(need)
        best = (0, 0, [])
        for st in range(0, max(1, len(rawsa) - 400), 500):
            w = set(stems(rawsa[st:st + 2400]))
            c = len(ns & w) / max(1, len(ns))
            if c > best[0]: best = (c, st, [x for x in dict.fromkeys(need) if x not in w])
        pg = 1
        for m in re.finditer(r'=== page (\d+) ===', raw):
            if m.start() <= best[1] * len(raw) / max(1, len(rawsa)): pg = int(m.group(1))
        cov, miss = best[0], best[2]
        txt = 'x'
        print(f"{f['id']}\t{cov:.2f}\t{'?' if not txt.strip() else ''}\t{' '.join(miss)[:110]}")
