# python scripts/ocr-grep.py <id_texte> "<regex>" [avant] [apres]
import sys, re, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = open(os.path.join(racine, 'sources', 'ocr', sys.argv[1] + '.txt'), encoding='utf-8').read()
av = int(sys.argv[3]) if len(sys.argv) > 3 else 80; ap = int(sys.argv[4]) if len(sys.argv) > 4 else 700
for m in list(re.finditer(sys.argv[2], t, re.I))[:3]:
    print('---', re.sub(r'\s+', ' ', t[max(0, m.start() - av): m.end() + ap]))
