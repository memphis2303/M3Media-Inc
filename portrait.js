'use strict';

const PORTRAIT_SUBJECTS={
  woman:{name:'Natural hair portrait',label:'A woman with short natural hair in a grey crewneck',face:[.50,.324,.158,.151]},
  man:{name:'Salt-and-pepper portrait',label:'A man with salt-and-pepper hair in a grey crewneck',face:[.50,.300,.173,.147]}
};

function portraitSubject(s,choice) {
  if(Object.hasOwn(PORTRAIT_SUBJECTS,choice)) return choice;
  return s.genre==='Boudoir'||['deep','brown'].includes(s.subject.skin)?'woman':'man';
}

function portraitGeometry(image,width,height,face) {
  const [cx,cy,rx,ry]=face, data=new Float32Array(width*height*6);
  const alpha=(x,y)=>image.data[(y*image.width+x)*4+3];
  for(let y=0;y<height;y++){
    const sourceY=Math.round(y/(height-1)*(image.height-1)), v=y/(height-1);
    let left=0,right=image.width-1;
    while(left<right && alpha(left,sourceY)<45) left++;
    while(right>left && alpha(right,sourceY)<45) right--;
    const edgeX=(left+right)/2, edgeRadius=Math.max(1,(right-left)/2);
    for(let x=0;x<width;x++){
      const u=x/(width-1), sourceX=u*(image.width-1);
      const edge=clamp((sourceX-edgeX)/edgeRadius,-1,1);
      const faceX=clamp((u-cx)/rx,-1,1);
      const faceY=clamp((cy-v)/ry,-1,1);
      const inHead=clamp((cy+ry+.035-v)/.085,0,1);
      const nx=(edge*.84*(1-inHead)+faceX*.91*inHead);
      const ny=(faceY*.66*inHead+clamp((.64-v)*2,-.25,.32)*(1-inHead));
      const nz=Math.sqrt(Math.max(.04,1-nx*nx-ny*ny));
      const index=(y*width+x)*6;
      data[index]=(u-cx)*(.090/rx);
      data[index+1]=(cy-v)*(.135/ry);
      data[index+2]=.080*nz;
      data[index+3]=nx;
      data[index+4]=ny;
      data[index+5]=nz;
    }
  }
  return data;
}

function portraitIllumination(s, rig, point, normal, lights) {
  const ambient=s.style==='high'?.59:s.style==='low'?.10:.21;
  const levels=[ambient,ambient,ambient*1.025];
  for(const source of lights){
    const gain=rig.lightGain(s,point,normal,source)*2.45;
    for(let c=0;c<3;c++) levels[c]+=source.color[c]*gain;
  }
  return levels.map(level=>Math.min(1.75,Math.sqrt(level)));
}

class PortraitView {
  constructor(canvas,rig,onStatus) {
    this.canvas=canvas;
    this.rig=rig;
    this.onStatus=onStatus;
    this.assets=new Map();
  }

  request(scene,choice) {
    this.scene=scene;
    this.id=portraitSubject(scene,choice);
    this.canvas.setAttribute('aria-label',PORTRAIT_SUBJECTS[this.id].label+' with simulated scene lighting');
    if(this.pending) return;
    this.pending=true;
    requestAnimationFrame(()=>{
      this.pending=false;
      if(!this.canvas.closest('.page')?.hidden && !this.canvas.closest('#view-portrait')?.hidden) this.render();
    });
  }

  async load(id) {
    this.assets.set(id,{loading:true});
    this.onStatus('Preparing portrait…');
    try {
      const photo=new Image();
      photo.src=PORTRAIT_IMAGE_DATA[id];
      await photo.decode();
      const buffer=document.createElement('canvas');
      buffer.width=photo.naturalWidth;
      buffer.height=photo.naturalHeight;
      const ctx=buffer.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(photo,0,0);
      const base=ctx.getImageData(0,0,buffer.width,buffer.height);
      const mapWidth=78,mapHeight=108;
      const geometry=portraitGeometry(base,mapWidth,mapHeight,PORTRAIT_SUBJECTS[id].face);
      this.assets.set(id,{buffer,ctx,base,geometry,mapWidth,mapHeight,lit:ctx.createImageData(buffer.width,buffer.height)});
    } catch {
      this.assets.set(id,{error:true});
    }
    if(this.id===id && !this.canvas.closest('#view-portrait')?.hidden) this.render();
  }

  render() {
    const asset=this.assets.get(this.id);
    if(!asset) {this.load(this.id);return;}
    if(asset.loading) {this.onStatus('Preparing portrait…');return;}
    if(asset.error) {
      this.onStatus('This portrait could not load. Choose another subject or switch to Studio.');
      return;
    }
    this.onStatus('');
    const s=this.scene, lights=this.rig.sources(s), center=vec(targetOf(s)), scale=s.subject.scale/100;
    const {buffer,ctx,base,lit,geometry,mapWidth,mapHeight}=asset;
    const map=new Float32Array(mapWidth*mapHeight*3);
    for(let i=0;i<mapWidth*mapHeight;i++){
      const offset=i*6;
      const point=[center[0]+geometry[offset]*scale,center[1]+geometry[offset+1]*scale,center[2]+geometry[offset+2]*scale];
      const normal=[geometry[offset+3],geometry[offset+4],geometry[offset+5]];
      map.set(portraitIllumination(s,this.rig,point,normal,lights),i*3);
    }
    for(let y=0;y<base.height;y++){
      const my=y/(base.height-1)*(mapHeight-1), top=Math.min(mapHeight-2,Math.floor(my)), fy=my-top;
      for(let x=0;x<base.width;x++){
        const pixel=(y*base.width+x)*4, alpha=base.data[pixel+3];
        lit.data[pixel+3]=alpha;
        if(!alpha) continue;
        const mx=x/(base.width-1)*(mapWidth-1), left=Math.min(mapWidth-2,Math.floor(mx)), fx=mx-left;
        const start=(top*mapWidth+left)*3, below=start+mapWidth*3;
        for(let c=0;c<3;c++){
          const upper=map[start+c]*(1-fx)+map[start+c+3]*fx;
          const lower=map[below+c]*(1-fx)+map[below+c+3]*fx;
          lit.data[pixel+c]=base.data[pixel+c]*(upper*(1-fy)+lower*fy);
        }
      }
    }
    ctx.putImageData(lit,0,0);
    const output=this.canvas.getContext('2d'), {width,height}=this.canvas;
    const background=output.createRadialGradient(width*.5,height*.39,0,width*.5,height*.49,width*.53);
    background.addColorStop(0,s.style==='high'?'#c9c7ce':'#414153');
    background.addColorStop(1,s.style==='high'?'#838590':'#11121a');
    output.fillStyle=background;
    output.fillRect(0,0,width,height);
    const drawHeight=height*1.05, drawWidth=drawHeight*buffer.width/buffer.height;
    output.drawImage(buffer,(width-drawWidth)/2,height-drawHeight,drawWidth,drawHeight);
  }
}
