'use strict';

const V = (x,y,z)=>[x,y,z];
const vec = o=>[o.x,o.y,o.z];
const add = (a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub = (a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul = (a,n)=>[a[0]*n,a[1]*n,a[2]*n];
const dot = (a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a=>mul(a,1/(Math.hypot(...a)||1));
const rotate = ([x,y,z],a)=>[x*Math.cos(a)+z*Math.sin(a),y,z*Math.cos(a)-x*Math.sin(a)];
const color = hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const rgb = values=>'rgb('+values.map(c=>Math.round(clamp(c,0,255))).join(',')+')';
const average = points=>mul(points.reduce(add,[0,0,0]),1/points.length);

function makeSphere() {
  const rings=20, segments=30, result=[];
  const vertex=(row,col)=>{
    const phi=Math.PI*row/rings, theta=2*Math.PI*col/segments;
    return [Math.sin(phi)*Math.sin(theta),Math.cos(phi),Math.sin(phi)*Math.cos(theta)];
  };
  for(let row=0;row<rings;row++) {
    for(let col=0;col<segments;col++) {
      const a=vertex(row,col), b=vertex(row+1,col), c=vertex(row+1,col+1), d=vertex(row,col+1);
      result.push(row===0?[a,b,c]:row===rings-1?[a,b,d]:[a,b,c,d]);
    }
  }
  return result;
}
const SPHERE=makeSphere();
const FIGURES=new Map();

class StudioView {
  constructor(canvas, onSelect, getSelection, getScene=Scene.get, getRoom=()=>null) {
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.onSelect=onSelect;
    this.getScene=getScene;
    this.getRoom=getRoom;
    this.getSelection=getSelection;
    this.reset();
    this.mode='orbit';
    this.markers=[];
    this.pending=false;
    canvas.addEventListener('pointerdown', e=>this.start(e));
    canvas.addEventListener('pointermove', e=>this.move(e));
    for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type,()=>this.end());
  }

  reset() {
    this.azimuth=.62;
    this.pitch=.42;
    this.radius=6.4;
    this.schedule();
  }

  schedule() {
    if (this.pending) return;
    this.pending=true;
    requestAnimationFrame(()=>{
      this.pending=false;
      if (this.mode==='orbit' && !this.canvas.closest('.page')?.hidden) this.draw();
    });
  }

  projection(s) {
    const room=this.getRoom();
    const center=room ? [0,.8,0] : [s.subject.x,s.subject.y+.96,s.subject.z];
    const radius=room ? Math.max(this.radius,Math.hypot(room.width,room.depth)*1.15) : this.radius;
    let eye=add(center,[Math.sin(this.azimuth)*Math.cos(this.pitch)*radius,Math.sin(this.pitch)*radius,Math.cos(this.azimuth)*Math.cos(this.pitch)*radius]);
    if (Math.hypot(...sub(eye,center))<.08) eye=add(center,[0,.02,.1]);
    const forward=unit(sub(center,eye));
    const side=cross(forward,[0,1,0]);
    const right=Math.hypot(...side)<.001 ? [1,0,0] : unit(side);
    const up=unit(cross(right,forward));
    const {width,height}=this.canvas;
    const projection={eye,forward,right,up,x:width/2,y:height/2,f:width*.73};
    if(room) {
      const corners=[];
      for(const x of [-room.width/2,room.width/2]) {
        for(const y of [0,room.height]) {
          for(const z of [-room.depth/2,room.depth/2]) {
            const delta=sub([x,y,z],eye), depth=dot(delta,forward);
            corners.push([dot(delta,right)/depth,-dot(delta,up)/depth]);
          }
        }
      }
      const xs=corners.map(point=>point[0]), ys=corners.map(point=>point[1]);
      const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
      projection.f=Math.min(width*.84/(maxX-minX),height*.8/(maxY-minY));
      projection.x-=projection.f*(minX+maxX)/2;
      projection.y-=projection.f*(minY+maxY)/2;
    }
    return projection;
  }

  project(point) {
    const {eye,forward,right,up,f,x,y}=this.view;
    const rel=sub(point,eye), depth=dot(rel,forward);
    if (depth<.11) return null;
    return [x+f*dot(rel,right)/depth,y-f*dot(rel,up)/depth,depth];
  }

  pointer(e) {
    const r=this.canvas.getBoundingClientRect();
    return [(e.clientX-r.left)*this.canvas.width/r.width,(e.clientY-r.top)*this.canvas.height/r.height];
  }

  floorPoint(pixel,height,view) {
    const ray=add(view.forward,add(mul(view.right,(pixel[0]-view.x)/view.f),mul(view.up,-(pixel[1]-view.y)/view.f)));
    if (Math.abs(ray[1])<.035) return null;
    const d=(height-view.eye[1])/ray[1];
    return d>0 ? add(view.eye,mul(ray,d)) : null;
  }

  start(e) {
    if (!this.onSelect || this.mode!=='orbit' || !this.view || e.button!==0) return;
    const pixel=this.pointer(e);
    const hitDistance=({point})=>Math.hypot(point[0]-pixel[0],point[1]-pixel[1]);
    const item=[...this.markers].filter(m=>hitDistance(m)<42).sort((a,b)=>hitDistance(a)-hitDistance(b))[0];
    const object=item && Scene.get()[item.id];
    const height=object ? object.y+(item.id==='subject'?.83:0) : 0;
    this.drag={pixel,item,object,height,view:this.view,azimuth:this.azimuth,pitch:this.pitch,
      origin:this.floorPoint(pixel,height,this.view),changed:false};
    if (item) this.onSelect(item.id);
    this.canvas.setPointerCapture(e.pointerId);
  }

  move(e) {
    if (!this.drag) return;
    const d=this.drag, p=this.pointer(e);
    if (!d.item) {
      this.azimuth=d.azimuth-(p[0]-d.pixel[0])*.005;
      this.pitch=clamp(d.pitch+(p[1]-d.pixel[1])*.004,.12,1.28);
      this.schedule();
      return;
    }
    const hit=this.floorPoint(p,d.height,d.view);
    if (!hit || !d.origin) return;
    d.changed=true;
    Scene.edit(d.item.id,{x:d.object.x+hit[0]-d.origin[0],z:d.object.z+hit[2]-d.origin[2]},'drag',false);
  }

  end() {
    if (!this.drag) return;
    const changed=this.drag.changed;
    this.drag=null;
    if (changed) Scene.set(Scene.get(),'drag-end');
  }

  poly(points, fill, stroke, width=1) {
    if (points.some(p=>!p)) return;
    const ctx=this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1]);
    for (const p of points.slice(1)) ctx.lineTo(p[0],p[1]);
    if (fill) {ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
    if (stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }

  line(a,b,stroke,width=1) {this.poly([this.project(a),this.project(b)],null,stroke,width);}

  sources(s) {
    const aim=vec(targetOf(s));
    const sources=LIGHTS.filter(id=>s[id].enabled && s[id].power>0).map(id=>{
      const l=s[id], from=vec(l), direction=unit(sub(aim,from));
      const across=unit(cross(direction,[0,1,0]));
      const up=unit(cross(across,direction));
      const radius=l.softness*.007;
      const taps=[from];
      if (radius>.08) {
        for(const offset of [mul(across,radius),mul(across,-radius),mul(up,radius),mul(up,-radius)]) taps.push(add(from,offset));
      }
      const rated=l.source==='daylight'?1:Math.sqrt(Math.max(.01,l.watts)/200);
      return {from,direction,taps, radius, grid:l.grid, strength:l.power/100*3.3* rated*2**(-EQUIPMENT[l.modifier].loss*.45), color:EQUIPMENT[l.gel]?.rgb || [1,.94,.91]};
    });
    const direct=sources.slice();
    for(const id of REFLECTORS.filter(id=>s[id].enabled)) {
      const reflector=s[id], from=vec(reflector);
      let total=0;
      const bounced=[0,0,0];
      for(const light of direct) {
        const delta=sub(from,light.from);
        const gain=light.strength/Math.max(.6,dot(delta,delta));
        if(this.flagBlocks(s,from,light.from)) continue;
        total+=gain;
        for(let i=0;i<3;i++) bounced[i]+=gain*light.color[i];
      }
      if(!total) continue;
      const tint=reflector.finish==='gold'?[1,.76,.46]:[1,1,1];
      const factor={white:.23,silver:.37,gold:.31}[reflector.finish];
      sources.push({from,direction:unit(sub(aim,from)),taps:[from],radius:.4,grid:false,strength:total*factor,
        color:bounced.map((c,i)=>c/total*tint[i]),bounce:true});
    }
    return sources;
  }

  flagBlocks(s, point, source) {
    if(!s.flag.enabled) return false;
    const center=vec(s.flag), a=radians(s.flag.yaw);
    const normal=[Math.sin(a),0,Math.cos(a)], delta=sub(source,point);
    const denom=dot(delta,normal);
    if(Math.abs(denom)<.0001) return false;
    const t=dot(sub(center,point),normal)/denom;
    if(t<=0 || t>=1) return false;
    const offset=sub(add(point,mul(delta,t)),center);
    return Math.abs(offset[1])<.55 && Math.abs(dot(offset,[Math.cos(a),0,-Math.sin(a)]))<.36;
  }

  noseBlocks(point,tap,nose) {
    const local=p=>rotate(sub(p,nose.center),-nose.yaw).map((v,i)=>v/nose.radii[i]);
    const start=local(point), ray=sub(local(tap),start);
    const along=-dot(start,ray)/dot(ray,ray);
    if(along<.001 || along>=1) return false;
    const nearest=add(start,mul(ray,along));
    return dot(nearest,nearest)<1;
  }

  lightGain(s,point,normal,source,nose=null) {
    const beam=dot(unit(sub(point,source.from)),source.direction);
    const spread=source.grid ? clamp((beam-.82)/.16,0,1) : clamp((beam+.10)/.95,0,1);
    if(!spread) return 0;
    let sum=0;
    for(const tap of source.taps) {
      const ray=sub(tap,point), ndotl=Math.max(0,dot(normal,unit(ray)));
      if (ndotl && !this.flagBlocks(s,point,tap) && (!nose || !this.noseBlocks(point,tap,nose))) sum+=ndotl/Math.max(.12,dot(ray,ray));
    }
    return source.strength*spread*sum/source.taps.length;
  }

  shade(s,point,normal,base,lights,nose,skin=false) {
    const ambient=s.style==='high'?.45:s.style==='low'?.095:skin?.24:.18;
    const values=[ambient,ambient,ambient*1.12];
    const eye=skin?unit(sub(this.view.eye,point)):null;
    const highlights=[0,0,0];
    for(const source of lights) {
      const gain=this.lightGain(s,point,normal,source,nose);
      const half=skin?unit(add(eye,unit(sub(source.from,point)))):null;
      const sheen=skin?.085*Math.max(0,dot(normal,half))**14*gain:0;
      for(let i=0;i<3;i++) {
        values[i]+=source.color[i]*gain;
        highlights[i]+=source.color[i]*sheen;
      }
    }
    return rgb(base.map((v,i)=>v*Math.sqrt(values[i])+255*highlights[i]));
  }

  sphere(faces, s, lights, center, sizes, material, yaw=0, nose=null) {
    for(const face of SPHERE) {
      const n=average(face);
      const normal=rotate(unit(n.map((v,i)=>v/sizes[i])),yaw);
      const toWorld=p=>add(center,rotate(p.map((v,i)=>v*sizes[i]),yaw));
      const point=toWorld(n);
      if(dot(normal,sub(this.view.eye,point))<=0) continue;
      const projected=face.map(p=>this.project(toWorld(p)));
      if(projected.some(p=>!p)) continue;
      faces.push({depth:average(projected)[2],projected,fill:this.shade(s,point,normal,material,lights,nose)});
    }
  }

  figure(faces,s,lights,world,skin,size,build,yaw) {
    const seated=s.subject.form==='seated', maternity=s.genre==='Maternity';
    const key=[seated,build,maternity].join(':');
    if(!FIGURES.has(key)){
      if(FIGURES.size>=8) FIGURES.delete(FIGURES.keys().next().value);
      FIGURES.set(key,buildFigure(seated,build,maternity));
    }
    const mix=(tone,fraction)=>skin.map((channel,i)=>channel*(1-fraction)+tone[i]*fraction);
    const wardrobe=maternity?'#8a4f54':s.genre==='Fashion'?'#3d6975':'#9e927f';
    const materials={
      face:skin,skin,top:color(wardrobe),trim:color(wardrobe).map(channel=>channel*.83),
      pants:color('#4b5563'),shoe:color('#33353c'),chair:color('#716354'),hair:color('#403132'),
      eyelid:mix([47,30,31],.58),sclera:mix([159,143,130],.77),iris:color('#5f493b'),
      pupil:color('#221c1a'),brow:mix([40,25,26],.75),nostril:mix([31,17,19],.82),
      upperLip:mix([126,58,61],.28),lowerLip:mix([162,86,84],.28),lipLine:mix([68,24,31],.56)
    };
    const nose={center:world([0,1.587-(seated?.42:0),.101]),radii:mul([.018,.019,.022],size),yaw};
    const vertices=new Map();
    const screen=vertex=>{
      if(!vertices.has(vertex)) vertices.set(vertex,this.project(world(vertex)));
      return vertices.get(vertex);
    };
    for(const face of FIGURES.get(key)){
      const point=world(face.point), normal=rotate(face.normal,yaw);
      if(dot(normal,sub(this.view.eye,point))<=0) continue;
      const projected=face.points.map(screen);
      if(projected.some(p=>!p)) continue;
      const skinSurface=face.material==='face'||face.material==='skin';
      const material=materials[face.material];
      const fill=this.shade(s,point,normal,material,lights,face.material==='face'?nose:null,skinSurface);
      faces.push({depth:average(projected)[2],projected,fill});
    }
  }

  subject(s,lights) {
    const faces=[], o=s.subject, yaw=radians(o.yaw), size=o.scale/100, build=o.build/100;
    const skin=color(SKIN[o.skin][1]), dark=color('#302235');
    const world=center=>add(vec(o),rotate(mul(center,size),yaw));
    const model=(center, radii, col, proportion=true, nose=null)=>{
      const sizes=radii.map((v,i)=>v*size*(i===0 && proportion?build:1));
      this.sphere(faces,s,lights,world(center),sizes,col,yaw,nose);
    };
    if(o.form==='table') {
      model([0,.72,0],[.63,.055,.45],color('#86686d'));
      model([0,.34,0],[.09,.36,.10],dark);
      if(s.genre==='Food'){
        model([0,.80,0],[.32,.041,.28],color('#b5a4ab'));
        for(const [x,z] of [[-.11,.04],[.09,.09],[.05,-.10]]) model([x,.90,z],[.077,.094,.07],color('#d59450'));
      } else {
        model([0,1,0],[.12,.22,.105],color('#be7646'));
        model([0,1.23,0],[.057,.07,.06],color('#d3b39d'));
      }
    } else {
      this.figure(faces,s,lights,world,skin,size,build,yaw);
    }
    faces.sort((a,b)=>b.depth-a.depth);
    for(const face of faces) this.poly(face.projected,face.fill,face.fill,.40);
  }

  ground(s,lights) {
    const ctx=this.ctx, w=this.canvas.width,h=this.canvas.height;
    const bright=s.style==='high', orbit=this.mode==='orbit';
    const backdrop=ctx.createLinearGradient(0,0,0,h);
    backdrop.addColorStop(0,bright?'#82788b':orbit?'#1c1c26':'#24212d');
    backdrop.addColorStop(1,bright?'#c1b4c7':orbit?'#30303f':'#13131b');
    ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);
    if(orbit){
      for(let i=-8;i<=8;i++) {
        const stroke=i===0?'#aa90cc58':'#baa6da31';
        for(let j=-8;j<8;j++){
          this.line([i,0,j],[i,0,j+1],stroke);
          this.line([j,0,i],[j+1,0,i],stroke);
        }
      }
    }
    const room=this.getRoom();
    if(orbit && room) {
      const w=room.width/2,d=room.depth/2;
      const floor=[[-w,0,-d],[w,0,-d],[w,0,d],[-w,0,d]];
      for(let i=0;i<4;i++){
        const a=floor[i],b=floor[(i+1)%4];
        this.line(a,b,'#efbb77',2);
        const roofA=[a[0],room.height,a[2]],roofB=[b[0],room.height,b[2]];
        this.line(a,roofA,'#efbb7755',1.25);
        this.line(roofA,roofB,'#efbb7780',1.25);
      }
    }
    const floor=this.project([s.subject.x,0,s.subject.z]);
    const axis=this.project([s.subject.x+.25,0,s.subject.z]);
    if(floor && axis) this.shadow(floor,Math.max(8,Math.abs(axis[0]-floor[0])*1.7),.39,30);
    if(s.subject.y<1) {
      for(const source of lights.filter(l=>!l.bounce && l.from[1]>1.30)){
        const height=s.subject.form==='standing'?1.16:s.subject.form==='seated'?.82:.7;
        const t=source.from[1]/Math.max(.42,source.from[1]-height-s.subject.y);
        const base=vec(s.subject), midpoint=[base[0],height+s.subject.y,base[2]];
        const point=add(source.from,mul(sub(midpoint,source.from),t));
        point[1]=0;
        const p=this.project(point);
        if(p && p[2]>.7) this.shadow(p,clamp(this.view.f/p[2]*.27,10,130),clamp(source.strength*.24,.04,.32),5+source.radius*31);
      }
    }
  }

  shadow(point,rx,alpha,blur) {
    const ctx=this.ctx;
    ctx.save();
    ctx.filter='blur('+blur+'px)';
    ctx.fillStyle='rgba(7,3,13,'+alpha+')';
    ctx.beginPath();ctx.ellipse(point[0],point[1],rx,Math.max(4,rx*.36),0,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  fixture(center,target,width,height,depth,frontFill,stroke) {
    const forward=unit(sub(target,center));
    const side=cross(forward,[0,1,0]);
    const right=Math.hypot(...side)<.001 ? [1,0,0] : unit(side);
    const up=unit(cross(right,forward));
    const frame=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>add(center,add(mul(right,x*width),mul(up,y*height))));
    const face=frame.map(p=>this.project(p));
    const back=frame.map(p=>this.project(sub(p,mul(forward,depth))));
    this.poly(back,'#292235',stroke,1.2);
    for(let i=0;i<4;i++) {
      const next=(i+1)%4;
      this.poly([back[i],back[next],face[next],face[i]],'#392d4b',stroke,1.2);
    }
    const litSide=dot(forward,sub(this.view.eye,center))>0;
    this.poly(face,litSide?frontFill:'#483858',stroke,1.5);
  }

  markersFor(s) {
    const target=vec(targetOf(s));
    const chosen=this.getSelection();
    this.markers=[];
    for(const id of Object.keys(OBJECTS)){
      const o=s[id], point=vec(o);
      if(o.enabled===false) continue;
      if(id==='subject') point[1]+=.83;
      const p=this.project(point);
      if(!p) continue;
      this.markers.push({id,point:p});
      if(id==='subject') continue;
      const selected=chosen===id, stroke=selected?'#f7d7a0':'#a9a5c9';
      const floor=[point[0],0,point[2]];
      this.line(floor,point,stroke+'86',1.5);
      if(LIGHTS.includes(id)){
        const width={strip:.11,dish:.20,bare:.095,softbox:.23,umbrella:.35}[o.modifier];
        const height=o.modifier==='strip'?.36:width*.89;
        const gel=EQUIPMENT[o.gel]?.rgb;
        const panel=gel?rgb(gel.map(v=>100+v*145)):'#e0ddec';
        this.fixture(point,target,width,height,.19,panel,stroke);
      }
      if(LIGHTS.includes(id) && o.power>0){
        const spread=o.grid?.19:.38;
        this.ctx.setLineDash([5,8]);
        this.line(point,add(target,[-spread,0,0]),stroke+'80');
        this.line(point,add(target,[spread,0,0]),stroke+'80');
        this.ctx.setLineDash([]);
      }
      if(id==='camera') {
        this.fixture(point,target,.19,.11,.19,'#756795',stroke);
        this.line(point,target,'#baa8ea68');
      }
      if(id==='flag' || REFLECTORS.includes(id)) {
        const a=radians(o.yaw??30), center=vec(o);
        const frame=[[-.32,-.39,0],[.32,-.39,0],[.32,.39,0],[-.32,.39,0]].map(v=>this.project(add(center,rotate(v,a))));
        this.poly(frame,id==='flag'?'#241e2c':'#a58cbc45',stroke+'88',1.5);
      }
    }
    this.markers.sort((a,b)=>b.point[2]-a.point[2]);
    for(const {id,point:[x,y]} of this.markers) {
      const selected=chosen===id;
      const ctx=this.ctx;
      ctx.beginPath();ctx.arc(x,y,selected?16:11,0,Math.PI*2);
      ctx.fillStyle=selected?'#f0c77e':'#45435d';ctx.fill();
      ctx.strokeStyle=selected?'#ffe3af':'#adabc6';ctx.lineWidth=selected?2:1;ctx.stroke();
      ctx.font='600 15px system-ui';
      const text=OBJECTS[id][0], width=ctx.measureText(text).width;
      const left=clamp(x+18,4,this.canvas.width-width-16), top=clamp(y-12,4,this.canvas.height-26);
      ctx.fillStyle=selected?'#f4d49c':'#191924ed';
      ctx.beginPath();ctx.roundRect(left,top,width+12,24,5);ctx.fill();
      ctx.fillStyle=selected?'#1e170e':'#f1eefb';ctx.fillText(text,left+6,top+17);
    }
  }

  draw() {
    const s=this.getScene();
    if(!s) return;
    const lights=this.sources(s);
    this.view=this.projection(s);
    this.ground(s,lights);
    this.subject(s,lights);
    if(this.mode==='orbit') this.markersFor(s);
  }
}
