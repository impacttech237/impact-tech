# python scripts/art.py <texte> <n> [n...] [--L=900] : texte OCR complet des articles
import sys, re, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = [x for x in sys.argv[1:] if not x.startswith('--')]
L = int(([x[4:] for x in sys.argv if x.startswith('--L=')] or [900])[0])
raw = open(f'{R}/sources/ocr/{a[0]}.txt', encoding='utf-8').read()
for n in a[1:]:
    m = re.search(r'(?:ARTICLE|Article|Art\.?)\s*' + re.escape(n) + r'\b', raw)
    print(f'## art {n}:', re.sub(r'\s+', ' ', raw[m.start():m.start() + L]) if m else 'introuvable')
