import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Reconstructed in Three.js from visual references: a ribbed black equipment case.
export function mountScene(host, { opening = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(6.2, 3.3, 10.5); camera.lookAt(0, .08, 0);
  scene.add(new THREE.HemisphereLight(0xe6e6dc, 0x34363a, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(-2, 7, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9e4ef, 1.7); rim.position.set(5, 4, -6); scene.add(rim);
  const body = new THREE.Group(); scene.add(body);
  const shell = new THREE.MeshStandardMaterial({color:0x202123, metalness:.28, roughness:.69});
  const inset = new THREE.MeshStandardMaterial({color:0x101114, metalness:.3, roughness:.76});
  const trim = new THREE.MeshStandardMaterial({color:0x111315, metalness:.4, roughness:.57});
  const gold = new THREE.MeshStandardMaterial({color:0xd69e35, metalness:.18, roughness:.65});
  const metal = new THREE.MeshStandardMaterial({color:0x929187, metalness:.8, roughness:.35});
  function box(parent,w,h,d,x,y,z,mat,r=.045){
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  box(body,4.2,1.78,2.5,0,-.12,0,shell,.11);
  box(body,4.24,.17,2.57,0,-.96,0,trim,.035);
  box(body,3.68,1.43,.055,0,-.09,1.265,inset,.035);
  for (const x of [-1.92,-1.55,1.55,1.92]) box(body,.20,1.88,2.58,x,-.08,0,trim,.035);
  for (const x of [-1.76,1.76]) box(body,.24,1.48,.08,x,-.10,1.32,shell,.025);
  for (const z of [-.92,.92]) box(body,.08,1.45,.16,2.12,-.08,z,trim,.025);
  // Bold diagonal caution stripe on the right panel.
  const stripeGeometry=new THREE.BufferGeometry();
  stripeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([2.135,-.91,.06, 2.135,-.91,.88, 2.135,.75,-.10, 2.135,.75,-.94],3));
  stripeGeometry.setIndex([0,1,2,0,2,3]);stripeGeometry.computeVertexNormals();
  body.add(new THREE.Mesh(stripeGeometry,new THREE.MeshStandardMaterial({color:0xb88940,roughness:.85,side:THREE.DoubleSide})));
  // Label uses the lab identity rather than an official Valve logo.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');
  c.clearRect(0,0,512,512);c.strokeStyle='#847861';c.lineWidth=5;c.beginPath();c.moveTo(256,32);c.lineTo(430,252);c.lineTo(256,472);c.lineTo(82,252);c.closePath();c.stroke();
  c.fillStyle='#d9a43d';c.beginPath();c.moveTo(256,73);c.lineTo(390,260);c.lineTo(122,260);c.closePath();c.fill();
  c.fillStyle='#161719';c.font='900 94px sans-serif';c.textAlign='center';c.fillText('AI',256,233);c.fillStyle='#e8e8e2';c.font='bold 70px sans-serif';c.fillText('★',256,337);
  c.fillStyle='#c99b3c';c.fillRect(178,353,156,52);c.fillStyle='#191a1b';c.font='bold 35px sans-serif';c.fillText('AI LAB',256,391);
  const decal=new THREE.CanvasTexture(canvas);decal.colorSpace=THREE.SRGBColorSpace;
  const labelMat=new THREE.MeshBasicMaterial({map:decal,transparent:true,depthWrite:false});
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),labelMat);label.position.set(0,-.03,1.302);body.add(label);
  // Lid is hinged on the rear edge so it can visibly open.
  const lid=new THREE.Group();lid.position.set(0,.79,-1.26);body.add(lid);
  box(lid,4.35,.28,2.7,0,.08,1.26,trim,.085);
  box(lid,3.72,.17,2.3,0,.26,1.26,shell,.065);
  for(const x of [-1.68,-1.20,-.72,0,.72,1.2,1.68]) box(lid,.12,.10,2.12,x,.38,1.26,trim,.025);
  for(const x of [-1.7,1.7]) box(lid,.30,.33,.12,x,-.12,2.62,trim,.03);
  // Lock and retaining hasp on the near side.
  const lock=new THREE.Group();lock.position.set(1.53,.40,1.40);body.add(lock);
  const hoop=new THREE.Mesh(new THREE.TorusGeometry(.13,.035,8,20,Math.PI),metal);hoop.position.set(0,.23,0);lock.add(hoop);
  box(lock,.35,.38,.15,0,0,0,gold,.045);box(lock,.045,.10,.03,0,-.02,.09,inset,.01);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(3.4,48),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,side:THREE.DoubleSide}));
  shadow.rotation.x=-Math.PI/2;shadow.scale.y=.48;shadow.position.y=-1.13;scene.add(shadow);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const beginning=performance.now();let frame,last=0;
  function resize(){const {clientWidth:w,clientHeight:h}=host;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function animate(time){
    if(document.hidden){frame=null;return;}
    frame=requestAnimationFrame(animate);if(time-last<30)return;last=time;
    const t=(time-beginning)/1000;
    if(opening){
      const release=THREE.MathUtils.smoothstep(t,.75,1.30);
      const lift=THREE.MathUtils.smoothstep(t,1.30,2.75);
      lock.position.y=.40-release*.75;lock.rotation.z=release*.6;
      lid.rotation.x=-lift*1.08;
      body.rotation.y=Math.sin(t*1.2)*.03;
    } else { body.rotation.y=Math.sin(t*.4)*.08; }
    renderer.render(scene,camera);
  }
  function visibility(){if(!document.hidden&&!frame&&!reduced)frame=requestAnimationFrame(animate);}
  document.addEventListener('visibilitychange',visibility);if(!reduced)frame=requestAnimationFrame(animate);
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);scene.traverse(o=>o.geometry?.dispose());[shell,inset,trim,gold,metal,labelMat,shadow.material].forEach(m=>m.dispose());decal.dispose();renderer.dispose();renderer.domElement.remove();};
}
