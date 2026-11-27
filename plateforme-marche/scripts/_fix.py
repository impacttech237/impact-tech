import json,sys,io
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
def fix(fid,**kw):
    t=fid.split('.')[0]; p=f'data/faits/{t}.json'
    d=json.load(open(p,encoding='utf-8'))
    for f in d:
        if f['id']==fid: f.update(kw)
    json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
def ok(ids):
    p='data/releve.json'; d=json.load(open(p,encoding='utf-8'))
    n=[i for i in ids if i not in d['faits']]; d['faits']+=n
    json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1); print('relus +',len(n),'=',len(d['faits']))
