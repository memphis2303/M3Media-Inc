'use strict';

// Starting points for the depicted studies. These are recommendations, not image metadata.
const STUDY_LIGHTING={
  Portrait:[
    ['Place a softbox at 45° camera-left and above eye level. Move it until the far cheek shows a small triangle.','5.6',160,100,'Key 1/8'],
    ['Keep the key at 45° camera-left. Put a gridded stripbox behind camera-right for the shoulder edge.','5.6',160,100,'Key 1/8 · Rim 1/32'],
    ['Set a large softbox to one side of the chair. Bring a white reflector toward the shadow side if needed.','4',160,100,'Key 1/16'],
    ['Turn the shoulders away from a softbox at 35° and keep the face turned toward it.','5.6',160,100,'Key 1/8'],
    ['Feather a large softbox across the face and torso. Keep one hand in a pocket so the silhouette stays clean.','5.6',160,100,'Key 1/8'],
    ['Use a soft key to one side and mark the floor where the step meets the light.','5.6',160,100,'Key 1/8']],
  Headshot:[
    ['Place one softbox about 30° off-axis. Raise it just enough to move the reflection above the glasses.','5.6',160,100,'Key 1/8'],
    ['Add a low stripbox behind the far shoulder while keeping the loop shadow from the key.','5.6',160,100,'Key 1/8 · Rim 1/32'],
    ['Set a large softbox slightly above the seated eye line and feather it down toward the face.','5.6',160,100,'Key 1/8'],
    ['Place a large soft source 30° to one side and keep it slightly above the eye line.','5.6',160,100,'Key 1/8'],
    ['Feather a softbox across the front cheek so the slight forward chin movement stays lit.','5.6',160,100,'Key 1/8'],
    ['Put the key near the off-camera eye line so both eyes retain detail.','5.6',160,100,'Key 1/8']],
  Fashion:[
    ['Put a gridded stripbox behind and to one side. Turn the face until the edge catches the cheek.','8',160,100,'Rim 1/4'],
    ['Use a rear stripbox for the garment edge and a soft frontal fill to retain face and fabric detail.','8',160,100,'Rim 1/4 · Fill 1/8'],
    ['Use a large front-side softbox high enough to define the coat while reaching the hem.','8',160,100,'Key 1/4'],
    ['Place a broad source across the turning path and keep a low-power rear strip on the hem.','8',160,100,'Key 1/4 · Rim 1/16'],
    ['Feather a large softbox across the jacket and leave a little shadow under each sleeve.','8',160,100,'Key 1/4'],
    ['Light from the open side of the wall and use the wall as a soft return.','8',160,100,'Key 1/4']],
  Maternity:[
    ['Set a broad softbox about 40° off-axis and turn the subject so the light reaches the visible cheek.','5.6',160,100,'Key 1/8'],
    ['Place the soft key beside the chair and add a narrow rim behind the opposite shoulder.','5.6',160,100,'Key 1/8 · Rim 1/32'],
    ['Use a broad key slightly above eye level and feather it across the gown.','5.6',160,100,'Key 1/8'],
    ['Use a large source with enough spread to cover the short step and the hem.','5.6',160,100,'Key 1/8'],
    ['Aim a softbox along the wall so the wall returns a little light onto the shadow side.','5.6',160,100,'Key 1/8'],
    ['Seat the subject near a sheer-curtained window and place a white card on the shadow side.','4',200,400,'']],
  Boudoir:[
    ['Place a sheer curtain between the window and the bed. Let the white sheet bounce soft fill onto the face and shoulders.','2.8',200,400,'','Window light + sheet bounce','Reference look: low angle, bright pillows behind. Add +0.7 EV if the face is dark. With strobe instead: 200 Ws head in a 90 cm softbox 1.5 m camera-left through a scrim, 1/16 power, f/4, 1/160 s, ISO 200.'],
    ['Place a large softbox 45° to the bed and feather it across the face. Keep the bedside lamp as a warm practical.','4',160,200,'Key 1/16','Soft side key + warm practical','Softbox about 1.5 m from the subject, 1.6 m high. Lamp stays below frame-center and is not metered.'],
    ['Place a large softbox at the open side of the couch and feather it across the face and shoulders.','4',160,100,'Key 1/16','Feathered broad key','Softbox 1.5–2 m away. Turn the couch until the highlight runs down the arm and thigh.'],
    ['Place the subject just inside the window edge and use a white reflector opposite to lift the face.','2.8',200,400,'','Window light + white reflector','Reference look: backlit sheer, expose for the face and let the window run bright (+1 EV). Dim window? Add a 200 Ws strobe in a softbox at 1/8, f/4, 1/160 s, ISO 100, placed outside-left of the curtain.'],
    ['Set a gridded softbox at 45° camera-left, above the eyes. Flag spill and leave 1.8 m to the black seamless.','4',160,100,'Key 1/16','Gridded key, black seamless','Small studio: strobe 1.5 m from the subject. A grid and a black flag keep the backdrop from lifting to gray.'],
    ['Place a broad key at 45° and a gridded stripbox behind camera-right. Keep the rim about 1.5 stops below the key.','4',160,100,'Key 1/16 · Rim 1/64','Two-light separation on brown','Rim stripbox 30 × 90 cm behind the subject, 1/64. Add 1/8 s of exposure only if the brown reads too dark.'],
    ['Seat the subject at the window edge so the sheer curtain acts as a large softbox. Expose for the lit skin and let the far wall fall into shadow.','2.8',160,400,'','Window side light, dark falloff','Strobe option: 200 Ws in a 90 cm softbox 1.5 m outside-right of the curtain, 1/16, f/4, 1/160 s, ISO 200.'],
    ['Put a soft key beside the chair and feather it across the face. Keep the practical lamp low in the frame.','4',160,200,'Key 1/16','Soft side key at the chair','Softbox 1.5 m camera-left and slightly above eye level. White card on the shadow side if needed.']],
  Product:[
    ['Use a broad umbrella off-axis and move it until the glass reflects a clean vertical highlight.','8',160,100,'Key 1/4'],
    ['Use a softbox as key and place a gridded stripbox behind the tray for a narrow reflection.','8',160,100,'Key 1/4 · Rim 1/16'],
    ['Move the source to the side and use a white card to open the far edge of the bottle.','8',160,100,'Key 1/4'],
    ['Use a large softbox for both bottles and shift the plinths until the reflections separate.','8',160,100,'Key 1/4'],
    ['Raise a broad key above eye level and check the label for glare before shooting.','5.6',160,100,'Key 1/8'],
    ['Use a soft key beside the chair and angle the package toward a small white card.','5.6',160,100,'Key 1/8']],
  Food:[
    ['Put a stripbox behind and to the side of the bowl so the steam catches the light.','5.6',160,100,'Key 1/8'],
    ['Keep the side-back key and add a soft frontal fill at lower power to show the front edge.','5.6',160,100,'Key 1/8 · Fill 1/32'],
    ['Set a large source beside the table, slightly above it, to show texture without hiding the plate rim.','8',160,100,'Key 1/4'],
    ['Use a broad side key and a white bounce card on the opposite side to open both bowls.','8',160,100,'Key 1/4'],
    ['Move a softbox far enough back to cover both the chef’s face and the dish.','5.6',160,100,'Key 1/8'],
    ['Place the key just above the chef’s eye line and tilt the plate to avoid glare.','5.6',160,100,'Key 1/8']],
  Outdoor:[
    ['Use open sky as the key and seat the subject just inside the shade line.','4',250,200,''],
    ['Expose for the shaded background, then bring a small flash in near camera-right to lift the face.','4',160,100,'Fill 1/16'],
    ['Keep the walking route in even shade and pick a shutter speed that holds the step.','4',500,400,''],
    ['Use light reflected by the stone and turn the face toward open sky.','4',250,200,''],
    ['Seat the subject so the terrace wall blocks direct sunlight while the sky lights the face.','4',250,200,''],
    ['Place the subject inside the arch and face the brighter opening.','4',250,400,'']],
  Fitness:[
    ['Set one hard key 90° camera-left. Mark the floor so the athlete stays in the split light.','8',160,100,'Key 1/4'],
    ['Use a soft key on the face and a gridded rear stripbox to separate the chair and wheels.','8',160,100,'Key 1/4 · Rim 1/16'],
    ['Put a large softbox off-axis and high enough to light the face and both arms.','8',160,100,'Key 1/4'],
    ['Raise a broad key and turn the kettlebell until it shows a controlled highlight.','8',160,100,'Key 1/4'],
    ['Use a soft side key and a narrow edge light that reaches the prosthesis and the opposite shoulder.','8',160,100,'Key 1/4 · Rim 1/16'],
    ['Place a broad key across the step. Keep ambient low and use a short flash duration for movement.','8',160,100,'Key 1/4']],
  Creative:[
    ['Gel one beauty dish magenta and set it about 45° off-axis. Let the opposite side fall into shadow.','5.6',160,100,'Key 1/4'],
    ['Use magenta on the key and place an indigo fill on the opposite side. Test each color on its own.','5.6',160,100,'Key 1/4 · Fill 1/8'],
    ['Put a teal-gelled source to the side and keep its spill away from the warm wardrobe.','5.6',160,100,'Key 1/4'],
    ['Cross a warm key and a cool fill at different heights. Check the color mix at the face.','5.6',160,100,'Key 1/4 · Fill 1/8'],
    ['Put amber on one side and blue on the other. Angle both sources so the colors stay separated.','5.6',160,100,'Key 1/4 · Fill 1/8'],
    ['Use a narrow blue stripbox from behind and a soft neutral key on the face.','5.6',160,100,'Key 1/8 · Rim 1/16']]
};

function cameraStart(aperture,shutter,iso) {
  return [['Aperture',aperture],['Shutter',shutter],['ISO',iso]];
}

function exposureValues(values) {
  return `<dl class="field-exposure">${values.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}

function studyLighting(genre,index) {
  const row=STUDY_LIGHTING[genre]?.[index];
  if(!row) return '';
  const [technique,f,shutter,iso,power,name,alt]=row;
  const recipeIndex=genre==='Boudoir'?index-4:index;
  const paired=recipeIndex>=0 && recipeIndex<2 && (genre!=='Boudoir'||index<6);
  const details=paired?shotReadout(editorialRecipes(createScene(genre))[recipeIndex].scene):{
    camera:cameraStart('f/'+f,'1/'+shutter+' s',iso),
    lighting:power?'Strobe starting power · '+power+' (200 Ws reference)':'Available light'
  };
  return `<div class="study-lighting">${name?`<p class="study-technique">${name}</p>`:''}<p><strong>How to light it</strong> ${technique}</p>
    ${exposureValues(details.camera)}<p>${details.lighting}</p>${alt?`<p class="study-alt">${alt}</p>`:''}</div>`;
}

function shotReadout(s) {
  const enabled=LIGHTS.filter(id=>s[id].enabled && s[id].power>0);
  const flashes=enabled.filter(id=>exposure(s,id).flash);
  const camera=exposure(s,flashes[0]||'key').settings;
  const primary=flashes[0];
  const primaryFraction=primary?exposure(s,primary).fraction:0;
  const watts=flashes.map(id=>{
    const level=s[id].power/s[primary].power;
    const fraction=primaryFraction*level*s[primary].watts/Math.max(1,s[id].watts);
    const stop=Math.min(0,Math.round(Math.log2(Math.max(1/128,fraction))));
    const power=fraction>1.42?'Full, meter and adjust':stop===0?'Full':'1/'+2**(-stop);
    return OBJECTS[id][0]+' '+power+' ('+s[id].watts+' Ws)';
  });
  return {
    camera:cameraStart(camera[0],camera[1],camera[2].replace('ISO ','')),
    lighting:watts.length?'Strobe starting power · '+watts.join(' · '):'Available light'
  };
}

function recipeExposure(s) {
  const {camera,lighting}=shotReadout(s);
  return `<section class="recipe-exposure" aria-label="Starting exposure">
    <h3>Starting camera settings</h3>${exposureValues(camera)}<p>${lighting}</p>
  </section>`;
}
