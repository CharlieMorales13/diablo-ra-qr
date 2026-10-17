import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Carga los GLB de assets/models/. Si un archivo no existe, usa un modelo
// procedural de respaldo para que el juego siempre funcione.
const loader = new GLTFLoader();

function cargarGLB(url) {
  return new Promise(resolve => loader.load(url, resolve, undefined, () => resolve(null)));
}

// Escala el modelo para que mida `alto` y lo apoya sobre el suelo (y = 0).
function normalizar(obj, alto) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const s = alto / (size.y || 1);
  obj.scale.multiplyScalar(s);
  box.setFromObject(obj);
  obj.position.y -= box.min.y;
  const wrap = new THREE.Group();
  wrap.add(obj);
  return wrap;
}

const mat = color => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

function tilicheProcedural() {
  const g = new THREE.Group();
  const colores = [0xff5a00, 0xffc300, 0x00a86b, 0xe6007e, 0x1e90ff, 0x8a2be2];
  const tiras = [];
  // traje de retazos: tiras de tela alrededor del cuerpo
  for (let i = 0; i < 36; i++) {
    const tira = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, 0.004), mat(colores[i % colores.length]));
    const a = (i / 12) * Math.PI * 2;
    const nivel = Math.floor(i / 12);
    tira.position.set(Math.cos(a) * 0.035, 0.05 + nivel * 0.045, Math.sin(a) * 0.035);
    tira.rotation.y = -a;
    tiras.push(tira);
    g.add(tira);
  }
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), mat(0xd9c39a)); // máscara de estropajo
  cabeza.position.y = 0.19;
  const ala = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.005, 20), mat(0xc8a165)); // sombrero de palma
  ala.position.y = 0.215;
  const copa = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.04, 16), mat(0xc8a165));
  copa.position.y = 0.235;
  g.add(cabeza, ala, copa);
  g.userData.tiras = tiras;
  return g;
}

function magueyProcedural() {
  const g = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.11, 5), mat(0x5f8f6e));
    const a = (i / 10) * Math.PI * 2;
    hoja.position.set(Math.cos(a) * 0.02, 0.045, Math.sin(a) * 0.02);
    hoja.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
    g.add(hoja);
  }
  return g;
}

function tlayudaProcedural() {
  const g = new THREE.Group();
  const tortilla = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.006, 24), mat(0xd8b46a));
  const frijol = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.004, 24), mat(0x3b2216));
  frijol.position.y = 0.005;
  const quesillo = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 16), mat(0xfff6e0));
  quesillo.rotation.x = Math.PI / 2;
  quesillo.position.y = 0.009;
  g.add(tortilla, frijol, quesillo);
  g.position.y = 0.01;
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
}

export async function cargarModelos() {
  const [tiliche, maguey, tlayuda] = await Promise.all([
    cargarGLB('assets/models/tiliche.glb'),
    cargarGLB('assets/models/maguey.glb'),
    cargarGLB('assets/models/tlayuda.glb'),
  ]);
  return {
    tiliche: tiliche
      ? { objeto: normalizar(tiliche.scene, 0.24), clips: tiliche.animations }
      : { objeto: tilicheProcedural(), clips: [] },
    // maguey y tlayuda se clonan para cada aparición
    maguey: maguey ? normalizar(maguey.scene, 0.12) : magueyProcedural(),
    tlayuda: tlayuda ? normalizar(tlayuda.scene, 0.03) : tlayudaProcedural(),
  };
}
