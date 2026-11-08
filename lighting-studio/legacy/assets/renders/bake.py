import rt,numpy as np,sys,os
from PIL import Image
from multiprocessing import Pool
ST={'rembrandt':(45,.3,1.75,'rembrandt'),'loop':(30,.15,1.75,'loop'),'butterfly':(0,0,2.0,'butterfly'),'clamshell':(0,0,2.0,'clamshell'),'split':(90,0,1.3,'split'),'rim':(135,.25,1.8,'rim'),'high':(25,0,1.75,'high'),'low':(75,.2,1.35,'low'),'short':(50,.55,1.75,'short'),'broad':(35,-.55,1.75,'broad')}
os.makedirs('/tmp/rt/out',exist_ok=True)
def job(k):
    a,th,el,m=ST[k];K,F=rt.render(a,th,el,m)
    for nm,X in(('K',K),('F',F)):
        Image.fromarray((rt.enc(np.clip(X/1.5,0,1))*255).astype('uint8')).save(f'/tmp/rt/out/{k}_{nm}.png')
    return k
if __name__=='__main__':
    with Pool(min(4,os.cpu_count() or 1)) as p:
        for k in p.imap_unordered(job,list(ST)):print('done',k,flush=True)
