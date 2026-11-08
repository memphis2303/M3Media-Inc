import numpy as np, math, sys
from PIL import Image
W,H=720,540
f32=np.float32
def nrm(v): return v/np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-9)
def A(*a): return np.array(a,dtype=f32)
def ell(p,c,r):
    c=A(*c);r=A(*r);q=(p-c)/r
    k0=np.sqrt((q*q).sum(1));k1=np.sqrt(((p-c)/(r*r)).__pow__(2).sum(1))
    return k0*(k0-1)/np.maximum(k1,1e-6)
def sph(p,c,r): return np.sqrt(((p-A(*c))**2).sum(1))-r
def cap(p,a,b,r):
    a=A(*a);b=A(*b);pa=p-a;ba=b-a;h=np.clip((pa@ba)/(ba@ba),0,1)
    return np.sqrt(((pa-h[:,None]*ba)**2).sum(1))-r
def smin(a,b,k):
    h=np.clip(.5+.5*(b-a)/k,0,1);return b*(1-h)+a*h-k*h*(1-h)
def smax(a,b,k): return -smin(-a,-b,k)
PIV=A(0,1.15,0)
def head_q(p,th):
    c,s=math.cos(th),math.sin(th);q=(p-PIV)/1.12
    return np.stack([q[:,0]*c-q[:,2]*s,q[:,1],q[:,0]*s+q[:,2]*c],1)+PIV
def parts(p,th):
    q=head_q(p,th)
    d=smin(ell(q,(0,1.255,-.012),(.082,.086,.092)),ell(q,(0,1.195,.012),(.071,.080,.077)),.035)
    d=smin(d,ell(q,(0,1.122,.040),(.032,.026,.030)),.02)
    for s in(-1,1):d=smin(d,ell(q,(s*.052,1.200,.038),(.026,.021,.025)),.022)
    d=smin(d,ell(q,(0,1.240,.066),(.058,.016,.022)),.016)
    nz=smin(cap(q,(0,1.228,.072),(0,1.180,.092),.0082),sph(q,(0,1.174,.097),.0115),.008)
    for s in(-1,1):nz=smin(nz,sph(q,(s*.011,1.172,.088),.0075),.006)
    d=smin(d,nz,.016)
    for s in(-1,1):
        d=smax(d,-ell(q,(s*.030,1.222,.079),(.022,.013,.016)),.018)
        d=smin(d,ell(q,(s*.078,1.20,-.01),(.008,.022,.014)),.008)
    d=smax(d,-ell(q,(0,1.130,.082),(.022,.0035,.012)),.004)
    neck=cap(p,(0,1.10,-.005),(0,.95,-.005),.047)
    skin=smin(d,neck,.03)
    sh=smin(ell(p,(0,.99,-.01),(.20,.045,.09)),ell(p,(0,.83,0),(.19,.21,.09)),.09)
    skin=smin(skin,sh,.035)
    return skin,q
def sdf(p,th,bg=True,mats=False):
    skin,q=parts(p,th)
    if bg:
        b=p[:,2]+1.6;d=np.minimum(skin,b)
        if mats:return d,(b<skin).astype(int),q
        return d
    if mats:return skin,np.zeros(len(p),int),q
    return skin
def march(ro,rd,th):
    n=len(rd);t=np.full(n,.3,f32);hit=np.zeros(n,bool);act=np.arange(n)
    for i in range(70):
        if len(act)==0:break
        p=ro+rd[act]*t[act,None];d=sdf(p,th)
        h=d<.0008;hit[act[h]]=True
        t[act]=t[act]+d*.9
        keep=(~h)&(t[act]<4.5);act=act[keep]
    return t,hit
def normal(p,th):
    e=.0012;ks=[A(1,-1,-1),A(-1,-1,1),A(-1,1,-1),A(1,1,1)];g=0
    for k in ks:g=g+k*sdf(p+k*e,th)[:,None]
    return nrm(g)
def soft(p,L,th,k,maxt=3.0):
    n=len(p);res=np.ones(n,f32);t=np.full(n,.012,f32);act=np.arange(n)
    for i in range(36):
        if len(act)==0:break
        q=p[act]+L[act]*t[act,None];h=sdf(q,th,bg=False)
        res[act]=np.minimum(res[act],k*h/t[act]);t[act]+=np.clip(h,.006,.09)
        act=act[(res[act]>.003)&(t[act]<maxt)]
    return np.clip(res,0,1)
def ao(p,N,th):
    occ=0;s=1.0
    for i in range(1,5):
        h=.014*i;d=sdf(p+N*h,th,bg=False);occ+=(h-d)*s;s*=.72
    return np.clip(1-4.0*occ,0,1)
def lin(c): c=A(*c);return c**2.2
ALB={0:lin((.76,.54,.44)),1:lin((.8,.8,.78)),2:lin((.07,.05,.04)),3:lin((.12,.12,.13))}
def render(a,th,elev,mode,dist=1.5,kk=6.0):
    ro=A(0,1.22,.76);tg=A(0,1.13,0);fwd=nrm(tg-ro);rt=nrm(np.cross(fwd,A(0,1,0)));up=np.cross(rt,fwd)
    ty=math.tan(math.radians(40)/2);xs=(np.arange(W)+.5)/W*2-1;ys=1-(np.arange(H)+.5)/H*2
    X,Y=np.meshgrid(xs,ys);rd=nrm(fwd+X[...,None]*ty*W/H*rt+Y[...,None]*ty*up).reshape(-1,3).astype(f32)
    ar=math.radians(a);kp=A(dist*math.sin(ar),elev,dist*math.cos(ar));kt=A(0,1.18,0)
    hi=mode=='high';lo=mode=='low';cl=mode in('butterfly','clamshell')
    fp=A(0,.85,1.0) if cl else A(-.9,1.45,1.3)
    inner,outer=(math.radians(8),math.radians(15)) if lo else ((math.radians(30),math.radians(52)) if hi else (math.radians(15),math.radians(30)))
    bga=lin((.88,.88,.86)) if hi else lin((.012,.012,.012)) if lo else lin((.40,.35,.31))
    plaster=lin((.80,.75,.68))
    K=np.zeros((H*W,3),f32);F=np.zeros((H*W,3),f32);CH=60000
    for s0 in range(0,H*W,CH):
        r=rd[s0:s0+CH];t,hit=march(ro,r,th);P=ro+r*t[:,None]
        idx=np.where(hit)[0]
        if len(idx)==0:continue
        Pi=P[idx];Ni=normal(Pi,th);d,m,q=sdf(Pi,th,mats=True)
        isbg=(m==1);Ni[isbg]=A(0,0,1)
        alb=np.where(isbg[:,None],bga,plaster).astype(f32)
        L=nrm(kp-Pi);V=nrm(ro-Pi)
        diff=np.clip((np.sum(Ni*L,1)+.18)/1.18,0,1)
        sh=soft(Pi+Ni*.004,L,th,kk)
        cosang=np.sum(-L*nrm(kt-kp),1);cone=np.clip((cosang-math.cos(outer))/(math.cos(inner)-math.cos(outer)),0,1);cone=cone*cone*(3-2*cone)
        Hh=nrm(L+V);spec=.05*np.clip(np.sum(Ni*Hh,1),0,1)**40*(~isbg)*sh*cone
        kcol=alb*(1.7*diff*sh*cone)[:,None]+spec[:,None]
        aoo=ao(Pi,Ni,th);aoo[isbg]=1
        Lf=nrm(fp-Pi);df=np.clip((np.sum(Ni*Lf,1)+.3)/1.3,0,1)
        amb=.06*(.55+.45*Ni[:,1])
        fv=(.30 if cl else .16)*df+amb
        fcol=alb*(fv*aoo)[:,None]
        fcol[isbg]=bga*(.55 if hi else .06)
        K[idx+s0]=kcol;F[idx+s0]=fcol
    return K.reshape(H,W,3),F.reshape(H,W,3)
def enc(x):
    x=np.clip(x,0,1);return np.where(x<=.0031308,12.92*x,1.055*np.power(x,1/2.4)-.055)
def compose(K,F,w):
    v=K+w*F;v=1-np.exp(-v*1.35);return v
