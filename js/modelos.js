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
  obj.updateMatrixWorld(true); // con los huesos en su lugar, la caja de un personaje con rig sale bien
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

function diabloProcedural() {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 12), mat(0x1a1a1a)); // traje negro
  cuerpo.position.y = 0.09;
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), mat(0xb3121e)); // máscara roja
  cabeza.position.y = 0.19;
  g.add(cuerpo, cabeza);
  for (const s of [-1, 1]) {
    const cuerno = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.045, 8), mat(0xf2e6c9));
    cuerno.position.set(s * 0.02, 0.23, 0);
    cuerno.rotation.z = -s * 0.4;
    g.add(cuerno);
  }
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

function mazorcaProcedural() {
  const g = new THREE.Group();
  const grano = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.04, 4, 8), mat(0xffc300));
  grano.position.y = 0.035;
  g.add(grano);
  for (const s of [-1, 1]) {
    const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.06, 4), mat(0x6b8e23));
    hoja.position.set(s * 0.012, 0.03, 0);
    hoja.rotation.z = s * 0.3;
    g.add(hoja);
  }
  return g;
}

function mezcalProcedural() {
  const botella = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.06, 12), mat(0xf2f2ee));
  botella.position.y = 0.03;
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.022, 8), mat(0x1a1a1a));
  cuello.position.y = 0.07;
  const g = new THREE.Group();
  g.add(botella, cuello);
  return g;
}

// cerca de carrizo que tapa los 3 carriles: hay que saltarla (mide 7 cm, el salto sube 13)
function vallaProcedural() {
  const g = new THREE.Group();
  for (const x of [-0.31, 0.31]) {
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.08, 0.014), mat(0x5a3a1a));
    poste.position.set(x, 0.04, 0);
    g.add(poste);
  }
  for (const y of [0.028, 0.058]) {
    const carrizo = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.64, 8), mat(0xc8a165));
    carrizo.rotation.z = Math.PI / 2;
    carrizo.position.y = y;
    g.add(carrizo);
  }
  const colores = [0xe6007e, 0xffc300, 0x00a86b, 0x1e90ff, 0xff5a00];
  for (let i = 0; i < 9; i++) { // listones de colores amarrados
    const liston = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.003), mat(colores[i % 5]));
    liston.position.set(-0.28 + i * 0.07, 0.045, 0.008);
    g.add(liston);
  }
  return g;
}

export async function cargarModelos() {
  const [diablo, maguey, mazorca, mezcal] = await Promise.all([
    cargarGLB('assets/models/diablo.glb'),
    cargarGLB('assets/models/maguey.glb'),
    cargarGLB('assets/models/mazorca.glb'),
    cargarGLB('assets/models/mezcal.glb'),
  ]);
  return {
    diablo: diablo
      ? { objeto: normalizar(diablo.scene, 0.24), clips: diablo.animations }
      : { objeto: diabloProcedural(), clips: [] },
    // maguey y mazorca se clonan para cada aparición
    maguey: maguey ? normalizar(maguey.scene, 0.11) : magueyProcedural(), // agave escaneado
    mazorca: mazorca ? normalizar(mazorca.scene, 0.07) : mazorcaProcedural(),
    mezcal: mezcal ? normalizar(mezcal.scene, 0.08) : mezcalProcedural(),
    valla: vallaProcedural(),
  };
}
