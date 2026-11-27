# Contrôle automatique de chaque repère contre le texte (OCR) de son PDF.
# Usage : python scripts/controler-faits.py   ->  data/controle.json + rapport-controle.md
# Méthode : on cherche la valeur du repère (chiffres, ou nombre écrit en lettres) dans le PDF, à proximité des mots de l'énoncé.
# « confirme » = valeur retrouvée près des bons mots. « non_retrouve » = à relire à la main. Ce n'est PAS une relecture humaine.
import os, re, json, glob, unicodedata, datetime, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(racine, 'data')

def sans_accents(s): return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
# squelette de lettres : l'OCR confond o/a/e/c, l/i/t, n/m/r/h…
CLASSES = {}
for cl, ch in (('a', 'oaecuq'), ('l', 'litj'), ('n', 'nmrh'), ('d', 'dbpg'), ('s', 'szxkvwyf')):
    for c in ch: CLASSES[c] = cl
def squelette(w): return ''.join(CLASSES.get(c, c) for c in w)

def normaliser(s):
    s = sans_accents(s.lower())
    s = s.replace('’', "'").replace(' ', ' ')
    s = re.sub(r'\b(cent|vingt)s\b', r'\1', s)
    s = re.sub(r'(?<=\d)\s?[o0°]\s?/\s?[o0](?![a-z])', ' %', s)          # 0,75o/o -> 0,75 %
    s = re.sub(r'\b[l|i]\s?(?=\d[\d. ]{5,})', '1', s)                  # (l 0.000.000) -> 10.000.000
    s = re.sub(r'(?<=\d)[oO](?=\d|\b)', '0', s)             # 1O -> 10
    s = re.sub(r'(?<=\d)[lI|](?=\d)', '1', s)
    p = None
    while p != s:
        p = s; s = re.sub(r'(\d)[ .](\d{3})(?!\d)', r'\1\2', s)  # 100 000 000 -> 100000000
    s = re.sub(r'(\d),(\d)', r'\1.\2', s)
    return s

UNITES = ['zero', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
DIZ = {20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante', 60: 'soixante', 70: 'soixante-dix', 80: 'quatre-vingt', 90: 'quatre-vingt-dix'}
def en_lettres(n):
    """variantes d'écriture en lettres de 0..999."""
    if n < 20: return [UNITES[n]]
    if n < 100:
        d, u = divmod(n, 10)
        if d in (7, 9):
            base = 'soixante' if d == 7 else 'quatre-vingt'
            if d == 7 and u == 1: return ['soixante et onze', 'soixante-onze']
            return [base + '-' + UNITES[10 + u], base + ' ' + UNITES[10 + u]]
        if u == 0: return [DIZ[n]]
        return [DIZ[d * 10] + ('-et-' if u == 1 else '-') + UNITES[u], DIZ[d * 10] + (' et ' if u == 1 else ' ') + UNITES[u]]
    h, r = divmod(n, 100)
    pre = 'cent' if h == 1 else UNITES[h] + ' cent'
    if r == 0: return [pre]
    return [pre + ' ' + v for v in en_lettres(r)] + [pre + '-' + v for v in en_lettres(r)]

def formes(x):
    """écritures possibles d'un nombre dans le texte : chiffres, lettres, « N millions », « trois cent millions »."""
    f = set()
    if float(x).is_integer():
        n = int(x); f.add(str(n))
        if n < 1000:
            for w in en_lettres(n): f.add(sans_accents(w))
        for unite_, nom in ((1000000000, 'milliard'), (1000000, 'million'), (1000, 'mille')):
            if n >= unite_ and n % unite_ == 0 and n // unite_ < 1000:
                m = n // unite_
                pl = [nom] if nom == 'mille' else [nom, nom + 's']
                f.update(f'{m} {p}' for p in pl)
                if nom == 'mille' and m == 1: f.add('mille')
                else:
                    for w in en_lettres(m): f.update(sans_accents(w) + ' ' + p for p in pl)
    else:
        f.add(('%g' % x)); f.add(('%g' % x).replace('.', ','))
    return f

MOTS_VIDES = set('de du des la le les un une et au aux en d l a ou pour par sur dans qui que est sont ce cet cette ces se sa son ses leur leurs avec sans plus par apres avant entre lors'.split())
def mots_cles(s):
    s = normaliser(s); ws = re.findall(r'[a-z]{5,}', s)
    return [squelette(w[:7]) for w in ws if w not in MOTS_VIDES]

def charger_ocr():
    docs = {}
    for f in glob.glob(os.path.join(racine, 'sources', 'ocr', '*.txt')):
        docs[os.path.basename(f)[:-4]] = open(f, encoding='utf-8').read()
    return docs

def chunks(txt, taille=900, pas=450):
    n = normaliser(txt); out = []
    for i in range(0, max(1, len(n) - 1), pas):
        c = n[i:i + taille]; out.append((i, c, set(squelette(w[:7]) for w in re.findall(r'[a-z]{5,}', c))))
    return n, out

faits = []
for f in sorted(glob.glob(os.path.join(D, 'faits', '*.json'))):
    faits += json.load(open(f, encoding='utf-8'))
docs = charger_ocr(); cache = {}
res = {}; stats = {}
today = datetime.date.today().isoformat()
for fa in faits:
    tid = fa['texte']
    if tid not in docs: res[fa['id']] = {'s': 'sans_pdf'}; continue
    if tid not in cache: cache[tid] = chunks(docs[tid])
    n, ch = cache[tid]
    val = (fa.get('valeur_texte') or '') + ' ' + ' '.join(fa.get('items') or [])
    enonce = fa.get('enonce') or ''
    kw = set(mots_cles(enonce)); kv = set(mots_cles(val))
    nums = []
    vt = normaliser(val)
    for m in re.finditer(r'\d+(?:\.\d+)?', vt):
        x = float(m.group(0)); nums.append(x)
    if fa.get('type_valeur') == 'nombre' and fa.get('valeur') is not None and not nums: nums = [float(fa['valeur'])]
    # nombres écrits en toutes lettres dans la valeur du repère
    for w, k in [(w, i) for i, w in enumerate(UNITES)]:
        pass
    if os.environ.get('MUT') and nums: nums = [x * 3 + 7 for x in nums]   # test de sensibilité : valeurs volontairement fausses
    best = None
    if nums:
        principal = nums[0]
        fm = [sorted(formes(x), key=len, reverse=True) for x in nums]
        occ = []
        for forms in fm[:1]:
            for fo in forms:
                for m in re.finditer(r'(?<![\d.])' + re.escape(fo) + r'(?![\d])', n): occ.append(m.start())
        nart = re.findall(r'\d+', fa.get('article') or ''); apos = [m.start() for a_ in nart for m in re.finditer(r'art\w*\.?\s*' + a_ + r'(?!\d)', n)]
        score_best = -1
        u_ = (fa.get('unite') or '').lower(); vtl = vt
        UR = {'jours': r'jour|j\b', 'mois': r'mois', 'ans': r'\ban|annee', '%': r'%|pour ?cent|yo|oh|o/o|0/o', 'fcfa': r'fcfa|f ?cfa|franc|xaf|cfa|f\b', 'heures': r'heure', 'semaines': r'semaine'}
        ukey = next((k for k in UR if k in u_ or (k == '%' and '%' in vtl) or (k != '%' and re.search(UR[k], vtl))), None)
        if ukey: occ = [p_ for p_ in occ if re.search(UR[ukey], n[max(0, p_ - 14): p_ + 34])] or occ[:0]
        for pos in occ:
            fen = n[max(0, pos - 700): pos + 700]; ws = set(squelette(w[:7]) for w in re.findall(r'[a-z]{5,}', fen))
            sc = len(kw & ws) / max(1, len(kw)); sv = len(kv & ws) / max(1, len(kv)) if kv else 0
            autres = sum(1 for forms in fm[1:] if any(re.search(r'(?<![\d.])' + re.escape(fo) + r'(?![\d])', fen) for fo in forms))
            pres = any(0 <= pos - p_ <= 6000 for p_ in apos)
            tot = sc + .5 * sv + (1 if pres else 0) + (.3 * autres / max(1, len(fm) - 1) if len(fm) > 1 else 0)
            if tot > score_best: score_best = tot; best = (pos, sc, sv, autres, pres)
        if best is None: res[fa['id']] = {'s': 'non_retrouve', 'm': 'valeur absente du PDF'}; continue
        pos, sc, sv, autres, pres = best
        art = (fa.get('article') or '')
        am = re.search(r'\d+', art); art_ok = bool(am and re.search(r'art\w*\.?\s*' + am.group(0) + r'(?!\d)', n))
        ok = (pres and (sc >= .2 or sv >= .3)) if apos else (sc >= .5 and (len(kw) > 2 or sc >= .67)) or (sc >= .34 and sv >= .5)
        if apos and not pres: ok = sc >= .6
        res[fa['id']] = {'s': 'confirme' if ok else 'non_concluant', 'p': round(pos / max(1, len(n)), 3), 'kw': round(sc, 2), 'art': art_ok}
    else:
        # repère sans chiffre : couverture des mots de la valeur dans la meilleure fenêtre
        kk = kv | kw
        if not kk: res[fa['id']] = {'s': 'non_concluant'}; continue
        bsc = max((len(kk & ws) / len(kk), i) for i, c, ws in ch) if ch else (0, 0)
        res[fa['id']] = {'s': 'confirme' if bsc[0] >= .55 else 'non_concluant', 'kw': round(bsc[0], 2)}
for fa in faits:   # un piège ou une liste cite plusieurs chiffres : le contrôle automatique n'est pas fiable, on ne signale pas d'écart
    if fa['type'] in ('piege', 'liste') and res[fa['id']]['s'] == 'non_retrouve': res[fa['id']] = {'s': 'non_concluant'}
for v in res.values(): stats[v['s']] = stats.get(v['s'], 0) + 1
if os.environ.get('MUT'):
    import collections
    c = collections.Counter()
    for fa in faits:
        vt = normaliser((fa.get('valeur_texte') or '') + ' ' + ' '.join(fa.get('items') or []))
        if re.search(r'\d', vt) or (fa.get('type_valeur') == 'nombre' and fa.get('valeur') is not None): c[res[fa['id']]['s']] += 1
    print('MUTATION (faits chiffrés avec valeur fausse)', dict(c)); sys.exit()
json.dump({'genere_le': today, 'methode': "Valeur recherchée dans le texte OCR du PDF, près des mots de l'énoncé", 'faits': res}, open(os.path.join(D, 'controle.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(stats)
# rapport : par texte
par = {}
for fa in faits:
    r = res[fa['id']]; t = par.setdefault(fa['texte'], {}); t[r['s']] = t.get(r['s'], 0) + 1
lines = ['# Rapport de contrôle des repères contre les PDF', '', f'Généré le {today}. Contrôle automatique (OCR + recherche de la valeur) : ce n\'est pas une relecture humaine.', '', f'Global : {stats}', '', '| Texte | confirmé | non concluant | non retrouvé | sans PDF |', '|---|---|---|---|---|']
for k, t in sorted(par.items()): lines.append(f"| {k} | {t.get('confirme', 0)} | {t.get('non_concluant', 0)} | {t.get('non_retrouve', 0)} | {t.get('sans_pdf', 0)} |")
lines += ['', '## Valeurs non retrouvées dans le PDF (à relire à la main)', '']
for fa in faits:
    if res[fa['id']]['s'] == 'non_retrouve': lines.append(f"- `{fa['id']}` ({fa.get('article') or 'sans article'}) {fa['enonce']} : **{fa['valeur_texte']}**")
open(os.path.join(racine, 'rapport-controle.md'), 'w', encoding='utf-8').write('\n'.join(lines))
