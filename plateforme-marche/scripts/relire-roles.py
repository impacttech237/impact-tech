# python scripts/relire-roles.py <texte> [longueur] : repères non relus role/definition/liste avec l'extrait OCR de l'article cité
import sys, os, re, json, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tid = sys.argv[1]; L = int(sys.argv[2]) if len(sys.argv) > 2 else 600
faits = json.load(open(f'{R}/data/faits/{tid}.json', encoding='utf-8'))
rel = set(json.load(open(f'{R}/data/releve.json', encoding='utf-8'))['faits'])
raw = open(f'{R}/sources/ocr/{tid}.txt', encoding='utf-8').read()
types = os.environ.get('TYPES', 'role,definition,liste').split(',')
def art(n):
    n = n.strip()
    pat = r'(?:Article|ARTICLE|Art\.?)\s*' + (r'(?:1\s*(?:er|ER|°)|premier|1)' if n in ('1', '1er') else re.escape(n)) + r'\b'
    m = [x for x in re.finditer(pat, raw)]
    return m
for f in faits:
    if f['id'] in rel or f['type'] not in types: continue
    print('=' * 3, f['id'], f['type'], '|', f.get('article'))
    print('E:', f['enonce']); print('V:', f['valeur_texte'][:330])
    if f['type']=='definition':
        t=re.sub(r'\s*\(.*?\)','',f['enonce']).split(' / ')[0].strip()
        m=re.search(r'[«"“]\s*'+re.escape(t[:14]).replace('\ ',r'\s+'),raw,re.I)
        if m:
            print('  [déf] …'+re.sub(r'\s+',' ',raw[m.start():m.start()+L])); continue
    nums = re.findall(r'\d+(?:\s*(?:bis|ter))?', f.get('article') or '')
    seen = 0
    for n in nums[:2]:
        ms = art(n)
        if ms:
            i = ms[0].start(); print(f'  [art {n}] …' + re.sub(r'\s+', ' ', raw[i:i + L]))
        else: print(f'  [art {n}] introuvable')
