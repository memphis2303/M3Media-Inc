'use strict';

// Profile rows hold height, horizontal center, depth center, half-width and half-depth in meters.
const HEAD_PROFILE = [
  [1.466,0,-.014,.003,.005],[1.483,0,-.013,.038,.046],
  [1.510,0,-.008,.061,.068],[1.547,0,-.008,.077,.079],
  [1.586,0,-.010,.087,.087],[1.627,0,-.015,.085,.093],
  [1.677,0,-.019,.087,.093],[1.724,0,-.021,.077,.081],
  [1.760,0,-.026,.052,.056],[1.779,0,-.026,.004,.005]
];

function sampleProfile(profile,y) {
  let row=0;
  while(row<profile.length-2 && profile[row+1][0]<y) row++;
  const a=profile[row], b=profile[row+1];
  const before=profile[Math.max(0,row-1)], after=profile[Math.min(profile.length-1,row+2)];
  const span=b[0]-a[0], t=clamp((y-a[0])/span,0,1), t2=t*t, t3=t2*t;
  return a.slice(1).map((value,index)=>{
    const i=index+1, next=b[i];
    const m=(next-before[i])/(b[0]-before[0])*span;
    const n=(after[i]-value)/(after[0]-a[0])*span;
    return (2*t3-3*t2+1)*value+(t3-2*t2+t)*m+(-2*t3+3*t2)*next+(t3-t2)*n;
  });
}

const bump = (x,y,cx,cy,rx,ry) => Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));

function faceDepth(x,y) {
  const cheek=bump(Math.abs(x),y,.048,1.587,.029,.023);
  const socket=bump(Math.abs(x),y,.040,1.619,.022,.014);
  const brow=bump(Math.abs(x),y,.036,1.640,.026,.011);
  const nose=.018*bump(x,y,0,1.613,.015,.032)+.025*bump(x,y,0,1.586,.017,.013);
  const nostrils=.008*bump(Math.abs(x),y,.014,1.577,.009,.010);
  const mouth=.009*bump(x,y,0,1.549,.036,.017);
  return .010*cheek-.008*socket+.006*brow+nose+nostrils+mouth;
}

function headAt(y,theta) {
  const [cx,cz,rx,rz]=sampleProfile(HEAD_PROFILE,y);
  const x=cx+rx*Math.sin(theta), front=Math.cos(theta);
  return [x,y,cz+rz*front+Math.max(0,front)**3*faceDepth(x,y)];
}

function buildFigure(seated,build,maternity) {
  const mesh=[];
  const lower=seated?.42:0;
  const push=(points,normal,material)=>mesh.push({points,point:average(points),normal,material});
  const surface=(at,rows,segments,material)=>{
    const rings=Array.from({length:rows+1},(_,i)=>
      Array.from({length:segments},(_,j)=>at(i/rows,j*Math.PI*2/segments)));
    for(let i=0;i<rows;i++) for(let j=0;j<segments;j++) {
      const k=(j+1)%segments, p=rings[i][j], q=rings[i][k], r=rings[i+1][k], t=rings[i+1][j];
      const points=[p,q,r,t];
      const tone=typeof material==='function'?material(average(points),(j+.5)*Math.PI*2/segments):material;
      push(points,unit(cross(sub(r,p),sub(t,q))),tone);
    }
  };
  const loft=(profile,material,rows=24,segments=24)=>{
    const first=profile[0][0], last=profile.at(-1)[0];
    surface((fraction,theta)=>{
      const y=first+(last-first)*fraction, [cx,cz,w,d]=sampleProfile(profile,y);
      return [cx+Math.max(.001,w)*Math.sin(theta),y,cz+Math.max(.001,d)*Math.cos(theta)];
    },rows,segments,material);
  };
  const waist=seated?1.025:.905;
  const torso=[
    [waist,0,-.013,.155,.100],
    [1.065,0,-.010,.143,.095],[1.10,0,-.008,.136,.086],[1.17,0,-.005,.157,.102],
    [1.25,0,-.010,.179,.106],[1.31,0,-.014,.188,.091],[1.36,0,-.015,.163,.074],
    [1.40,0,-.011,.100,.063],[1.425,0,-.007,.062,.052],[1.435,0,-.006,.046,.046]
  ];
  loft(torso.map(([y,x,z,w,d])=>{
    const belly=maternity?.084*Math.exp(-Math.pow((y-1.017)/.11,2)):0;
    const shaping=belly*Math.min(1,(y-waist)/.085);
    return [y-lower,x,z+shaping*.60,w*build,d+shaping];
  }),p=>p[1]>1.413-lower?'trim':'top',40,36);
  const pelvisBottom=seated?.45:.79, pelvisTop=waist-lower;
  loft([[pelvisBottom,0,-.018,.098*build,.074],
    [(pelvisBottom+pelvisTop)/2,0,-.015,.158*build,.103],
    [pelvisTop,0,-.013,.155*build,.100]],'pants',18,36);
  loft([[1.40-lower,0,-.006,.052,.051],[1.435-lower,0,-.006,.051,.050],
    [1.475-lower,0,-.014,.050,.048],[1.512-lower,0,-.020,.057,.053]],'skin',14,26);
  for(const side of [-1,1]){
    const leg=seated?[
      [.084,.118,.317,.042,.043],[.19,.122,.311,.053,.053],[.33,.129,.299,.065,.065],
      [.45,.135,.276,.076,.078],[.51,.135,.203,.081,.141],[.56,.122,.122,.090,.221],
      [.592,.100,.037,.088,.136],[.608,.089,.008,.064,.081]
    ]:[
      [.082,.107,.000,.042,.044],[.155,.108,-.002,.046,.047],[.27,.112,-.011,.058,.054],
      [.41,.106,.008,.061,.064],[.52,.099,.019,.068,.064],[.66,.088,.010,.077,.078],
      [.79,.084,-.004,.087,.093],[.86,.083,-.013,.081,.087],[.89,.071,-.013,.061,.076]
    ];
    loft(leg.map(([y,x,z,w,d])=>[y,side*x*build,z,w*build,d]),'pants',32,26);
    const foot=seated?.35:.045, x=side*.115*build;
    loft([[.012,x,foot,.050,.097],[.022,x,foot,.052,.101],[.035,x,foot,.052,.100],
      [.071,x,foot-.014,.046,.080],[.103,x,foot-.034,.039,.044],[.115,x,foot-.041,.031,.039]],'shoe',14,22);

    const arm=[
      [.697,.216,.024,.016,.018],[.728,.221,.023,.029,.023],[.774,.221,.011,.031,.022],
      [.81,.221,-.002,.023,.022],[.868,.219,-.010,.026,.027],[.966,.212,-.018,.036,.034],
      [1.055,.203,-.022,.034,.035],[1.144,.191,-.017,.042,.043],
      [1.239,.179,-.009,.053,.051],[1.30,.167,-.005,.052,.052],[1.34,.151,-.012,.028,.039]
    ];
    const armRows=arm.map(([y,ax,z,w,d])=>{
      const forward=seated?Math.max(0,1.15-y)*.55:0;
      return [y-(seated?.32+(y-.70)*.16:0),side*ax*build,z+forward,w*build**.5,d];
    });
    const cuff=armRows[6][0];
    loft(armRows,p=>p[1]<cuff?'skin':p[1]<cuff+.022?'trim':'top',44,26);
  }
  if(seated){
    loft([[.448,0,-.047,.29,.24],[.48,0,-.047,.32,.26],[.505,0,-.047,.32,.26]],'chair',6,22);
    for(const x of [-.245,.245]) for(const z of [-.222,.125]){
      loft([[.015,x,z,.021,.022],[.46,x,z,.027,.028]],'chair',3,10);
    }
    loft([[.49,0,-.250,.25,.025],[.65,0,-.285,.25,.034],[.83,0,-.295,.245,.036],
      [.88,0,-.284,.207,.030]],'chair',10,24);
  }

  const hairline=theta=>{
    const front=Math.max(0,Math.cos(theta));
    return 1.550+.153*front**.65+.009*Math.sin(theta*2)*front;
  };
  surface((fraction,theta)=>{
    const y=1.466+fraction*.313;
    const p=headAt(y,theta), line=hairline(theta);
    const volume=clamp((y-line)/(1.779-line),0,1);
    p[0]*=1+.042*volume;
    p[2]+=(p[2]+.024)*.046*volume;
    p[1]+=.011*volume-lower;
    return p;
  },91,96,(p,theta)=>{
    const [x,vertical]=p, y=vertical+lower, faceX=Math.abs(x);
    if(y>hairline(theta)) return 'hair';
    if(Math.cos(theta)<.60) return 'face';
    const oval=(cx,cy,rx,ry)=>bump(faceX,y,cx,cy,rx,ry)>.38;
    if(oval(.039,1.619,.003,.0032)) return 'pupil';
    if(oval(.039,1.619,.006,.0047)) return 'iris';
    if(oval(.041,1.619,.016,.0048)) return 'sclera';
    if(oval(.041,1.619,.019,.0060)) return 'eyelid';
    if(oval(.041,1.639,.019,.0032)) return 'brow';
    if(oval(.012,1.575,.005,.0018)) return 'nostril';
    if(oval(0,1.548,.022,.0017)) return 'lipLine';
    if(oval(0,1.551,.024,.0039)) return 'upperLip';
    if(oval(0,1.544,.021,.0046)) return 'lowerLip';
    return 'face';
  });
  for(const side of [-1,1]){
    loft([[1.543-lower,side*.079,-.027,.003,.005],[1.560-lower,side*.084,-.026,.013,.015],
      [1.589-lower,side*.087,-.027,.014,.016],[1.611-lower,side*.085,-.030,.011,.013],
      [1.622-lower,side*.079,-.033,.004,.006]],'skin',14,18);
  }

  return mesh;
}
