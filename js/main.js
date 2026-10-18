import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { PREGUNTAS } from './preguntas.js';
import { initAudio, sfx, startMusic, stopMusic, vibrar } from './audio.js';
import { cargarModelos } from './modelos.js';

// ---------- configuración ----------
const CARRILES = [-0.22, 0, 0.22];
const Z_DIABLO = 0.3;      // donde corre el Diablo (lado cercano del marcador)
const Z_APARECE = -1.0;     // más lejos de esto los objetos no se ven
const Z_SALIDA = 0.65;
const TOTAL_PUERTAS = 12;
const VIDAS = 3;
const VELOCIDAD_BASE = 0.2; // unidades del marcador por segundo
const DEMO = new URLSearchParams(location.search).has('demo');

const $ = id => document.getElementById(id);
const ui = {
  hud: $('hud'), vidas: $('vidas'), puerta: $('puerta'), puntos: $('puntos'),
  pista: $('pista'), aviso: $('aviso'), escaneo: $('escaneo'), cuenta: $('cuenta'),
  inicio: $('inicio'), final: $('final'), rango: $('rango'), resumen: $('resumen'), record: $('record'),
  opciones: [...document.querySelectorAll('.opcion')],
};

// ---------- escena RA ----------
const mindar = new MindARThree({
  container: $('ar'),
  imageTargetSrc: 'assets/targets.mind',
  uiScanning: 'no',
  uiLoading: 'no',
  filterMinCF: 0.0001, // suaviza el temblor del seguimiento
  filterBeta: 0.001,
  missTolerance: 10,
});
const { renderer, scene, camera } = mindar;
renderer.outputColorSpace = THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.6));
const sol = new THREE.DirectionalLight(0xffffff, 1.2);
sol.position.set(0.5, 1, 1);
scene.add(sol);

const anchor = mindar.addAnchor(0);
// El marcador vive en el plano XY; giramos para trabajar con Y hacia arriba
// y el camino corriendo por Z (lejos = -Z, cerca de la cámara = +Z).
const mundo = new THREE.Group();
mundo.rotation.x = Math.PI / 2;
anchor.group.add(mundo);

// camino de tierra con líneas que se desplazan
const texCamino = crearTexturaCamino();
const camino = new THREE.Mesh(
  new THREE.PlaneGeometry(0.72, 1.7),
  new THREE.MeshStandardMaterial({ map: texCamino, transparent: true, opacity: 0.95 }),
);
camino.rotation.x = -Math.PI / 2;
camino.position.set(0, 0.001, -0.25);
mundo.add(camino);

// ---------- estado ----------
let modelos = null;
let diablo = null;
let mixer = null;
const acciones = {}; // correr y bailar
let accionActual = null;
let estado = null;
let marcadorVisible = false;
let arrancado = false;
const particulas = [];
const reloj = new THREE.Clock();

function nuevoEstado() {
  return {
    jugando: false,
    vidas: VIDAS,
    puntos: 0,
    combo: 1,
    aciertos: 0,
    puertasCruzadas: 0,
    velocidad: VELOCIDAD_BASE,
    carril: 1,
    tropiezo: 0,
    entidades: [],
    bolsa: barajar([...PREGUNTAS]).slice(0, TOTAL_PUERTAS),
    puertaActual: null,
  };
}

// ---------- utilidades ----------
function barajar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function crearTexturaCamino() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#b5743d';
  g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 400; i++) { // granitos de tierra
    g.fillStyle = Math.random() > 0.5 ? '#9a5f2e' : '#c98b52';
    g.fillRect(Math.random() * 256, Math.random() * 512, 3, 3);
  }
  g.fillStyle = '#fff5';
  for (const x of [85, 171]) for (let y = 0; y < 512; y += 64) g.fillRect(x - 3, y, 6, 36);
  g.fillStyle = '#ff5a00';
  g.fillRect(0, 0, 10, 512);
  g.fillRect(246, 0, 10, 512);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaLetrero(texto) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 280;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 512, 280);
  g.strokeStyle = '#121212';
  g.lineWidth = 16;
  g.strokeRect(8, 8, 496, 264);
  g.fillStyle = '#121212';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // ajusta tamaño de letra hasta que quepa en 3 líneas
  let size = 64, lineas;
  do {
    g.font = `800 ${size}px Segoe UI, system-ui, sans-serif`;
    lineas = partirTexto(g, texto, 460);
    size -= 4;
  } while ((lineas.length > 3 || lineas.length * size * 1.15 > 240) && size > 22);
  const alto = (size + 4) * 1.15;
  lineas.forEach((l, i) => g.fillText(l, 256, 140 + (i - (lineas.length - 1) / 2) * alto));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function partirTexto(g, texto, ancho) {
  const lineas = [];
  let linea = '';
  for (const p of texto.split(' ')) {
    const prueba = linea ? linea + ' ' + p : p;
    if (g.measureText(prueba).width > ancho && linea) { lineas.push(linea); linea = p; }
    else linea = prueba;
  }
  lineas.push(linea);
  return lineas;
}

// ---------- entidades ----------
function crearPuerta(pregunta, z) {
  // baraja opciones y recuerda en qué carril quedó el intruso
  const orden = barajar([0, 1, 2]);
  const opciones = orden.map(i => pregunta.opciones[i]);
  const intruso = orden.indexOf(pregunta.intruso);

  const g = new THREE.Group();
  const colores = [0xe6007e, 0xffc300, 0x00a86b, 0x1e90ff, 0xff5a00];
  for (const x of [-0.36, 0.36]) {
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: 0x5a3a1a }));
    poste.position.set(x, 0.11, 0);
    g.add(poste);
  }
  // papel picado sobre la puerta
  for (let i = 0; i < 10; i++) {
    const banderita = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), new THREE.MeshStandardMaterial({ color: colores[i % 5], side: THREE.DoubleSide }));
    banderita.position.set(-0.32 + i * 0.071, 0.2, 0);
    g.add(banderita);
  }
  opciones.forEach((texto, i) => {
    const letrero = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.11), new THREE.MeshBasicMaterial({ map: texturaLetrero(texto) }));
    letrero.position.set(CARRILES[i], 0.11, 0);
    g.add(letrero);
  });
  return { tipo: 'puerta', obj: g, z, pregunta, opciones, intruso, mostrada: false, resuelta: false };
}

function crearObjeto(tipo, z) {
  const obj = modelos[tipo].clone();
  const carril = Math.floor(Math.random() * 3);
  obj.position.x = CARRILES[carril];
  return { tipo, obj, z, carril, resuelta: false };
}

function programarTramo(zPuerta) {
  const e = estado;
  const indice = e.puertasCruzadas + e.entidades.filter(x => x.tipo === 'puerta' && !x.resuelta).length;
  if (indice >= TOTAL_PUERTAS) return;
  const nuevos = [
    crearObjeto('maguey', zPuerta + 0.75),
    crearObjeto('mazorca', zPuerta + 0.4),
    crearPuerta(e.bolsa[indice], zPuerta),
  ];
  for (const n of nuevos) {
    n.obj.visible = false;
    mundo.add(n.obj);
    e.entidades.push(n);
  }
}

// ---------- flujo de partida ----------
function animacion(nombre) { // transición suave entre correr y bailar
  const nueva = acciones[nombre];
  if (!nueva || nueva === accionActual) return;
  accionActual?.fadeOut(0.4);
  nueva.reset().fadeIn(0.4).play();
  accionActual = nueva;
}

function iniciarPartida() {
  if (estado) for (const ent of estado.entidades) mundo.remove(ent.obj);
  estado = nuevoEstado();
  diablo.position.set(CARRILES[1], 0, Z_DIABLO);
  diablo.rotation.y = Math.PI;
  diablo.scale.setScalar(1);
  animacion('correr');
  programarTramo(-1.3);
  actualizarHUD();
  ui.final.classList.add('oculto');
  ui.hud.classList.remove('oculto');
  cuentaRegresiva(() => {
    estado.jugando = true;
    startMusic();
  });
}

function cuentaRegresiva(listo) {
  let n = 3;
  ui.cuenta.classList.remove('oculto');
  ui.cuenta.textContent = n;
  sfx('click');
  const t = setInterval(() => {
    n--;
    if (n > 0) { ui.cuenta.textContent = n; sfx('click'); return; }
    clearInterval(t);
    ui.cuenta.textContent = '¡Corre!';
    sfx('correcto');
    setTimeout(() => ui.cuenta.classList.add('oculto'), 600);
    listo();
  }, 800);
}

function terminar() {
  estado.jugando = false;
  stopMusic();
  sfx('fin');
  if (acciones.bailar) { // el Diablo voltea hacia ti y baila
    estado.bailando = true;
    estado.carril = 1;
    for (const ent of estado.entidades) ent.obj.visible = false; // despeja el camino
    diablo.rotation.y = 0;
    diablo.scale.setScalar(1.6);
    animacion('bailar');
  }
  ui.hud.classList.add('oculto');
  const a = estado.aciertos;
  const rango = a >= 10 ? 'Oaxaqueño de corazón' : a >= 7 ? 'Paisano' : a >= 4 ? 'Fuereño curioso' : 'Turista';
  let record = 0;
  try {
    record = Math.max(estado.puntos, Number(localStorage.getItem('diablo-record')) || 0);
    localStorage.setItem('diablo-record', record);
  } catch { record = estado.puntos; }
  ui.rango.textContent = rango;
  ui.resumen.textContent = `${a} de ${TOTAL_PUERTAS} intrusos atrapados · ${estado.puntos} puntos`;
  ui.record.textContent = `Récord en este teléfono: ${record}`;
  ui.final.classList.remove('oculto');
}

function resolverPuerta(p) {
  const e = estado;
  e.puertasCruzadas++;
  const bien = e.carril === p.intruso;
  if (bien) {
    e.aciertos++;
    e.puntos += 100 * e.combo;
    e.combo = Math.min(e.combo + 1, 3);
    e.velocidad *= 1.06;
    sfx('correcto');
    vibrar(30);
    confeti(0xffc300);
    mostrarAviso(true, '¡Intruso atrapado!', p.pregunta.dato);
  } else {
    e.vidas--;
    e.combo = 1;
    e.tropiezo = 0.6;
    sfx('error');
    vibrar([80, 40, 80]);
    flashRojo();
    mostrarAviso(false, `El intruso era: ${p.opciones[p.intruso]}`, p.pregunta.dato);
  }
  ui.pista.classList.add('oculto');
  ui.opciones.forEach(b => (b.textContent = ''));
  e.puertaActual = null;
  actualizarHUD();
  if (e.vidas <= 0 || e.puertasCruzadas >= TOTAL_PUERTAS) {
    e.jugando = false;
    setTimeout(terminar, 1800);
  } else {
    programarTramo(-1.6);
  }
}

function resolverObjeto(o) {
  if (o.carril !== estado.carril) return;
  if (o.tipo === 'mazorca') {
    estado.puntos += 25;
    sfx('moneda');
    vibrar(15);
    confeti(0xd8b46a);
    o.tomada = true;
  } else {
    estado.puntos = Math.max(0, estado.puntos - 30);
    estado.tropiezo = 0.6;
    sfx('golpe');
    vibrar(120);
    flashRojo();
  }
  actualizarHUD();
}

function mostrarPregunta(p) {
  estado.puertaActual = p;
  ui.pista.textContent = p.pregunta.pista;
  ui.pista.classList.remove('oculto');
  ui.opciones.forEach((b, i) => (b.textContent = p.opciones[i]));
}

let avisoTimer = null;
function mostrarAviso(bien, titulo, dato) {
  ui.aviso.className = bien ? 'bien' : 'mal';
  ui.aviso.innerHTML = '';
  const b = document.createElement('b');
  b.textContent = titulo;
  ui.aviso.append(b, dato);
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => ui.aviso.classList.add('oculto'), 3500);
}

function flashRojo() {
  document.body.classList.remove('flash-rojo');
  void document.body.offsetWidth; // reinicia la animación CSS
  document.body.classList.add('flash-rojo');
}

function actualizarHUD() {
  ui.vidas.textContent = '❤'.repeat(estado.vidas) + '♡'.repeat(VIDAS - estado.vidas);
  ui.puerta.textContent = `Puerta ${Math.min(estado.puertasCruzadas + 1, TOTAL_PUERTAS)}/${TOTAL_PUERTAS}`;
  ui.puntos.textContent = estado.puntos + (estado.combo > 1 ? ` x${estado.combo}` : '');
  ui.opciones.forEach((b, i) => b.classList.toggle('activa', i === estado.carril));
}

// ---------- controles táctiles ----------
function moverA(carril) {
  if (!estado?.jugando) return;
  estado.carril = Math.max(0, Math.min(2, carril));
  sfx('click');
  vibrar(10);
  actualizarHUD();
}

function pulsar(btn) {
  btn.classList.add('pulsado');
  setTimeout(() => btn.classList.remove('pulsado'), 120);
}

$('izq').addEventListener('pointerdown', e => { pulsar(e.currentTarget); moverA(estado.carril - 1); });
$('der').addEventListener('pointerdown', e => { pulsar(e.currentTarget); moverA(estado.carril + 1); });
ui.opciones.forEach(b => b.addEventListener('pointerdown', () => { pulsar(b); moverA(Number(b.dataset.carril)); }));
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') moverA(estado.carril - 1);
  if (e.key === 'ArrowRight') moverA(estado.carril + 1);
});

// ---------- partículas ----------
function confeti(colorExtra) {
  const colores = [0xff5a00, 0xe6007e, 0x00a86b, 0x1e90ff, colorExtra];
  for (let i = 0; i < 40; i++) {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.012, 0.008),
      new THREE.MeshBasicMaterial({ color: colores[i % colores.length], side: THREE.DoubleSide }),
    );
    p.position.copy(diablo.position).add(new THREE.Vector3(0, 0.2, 0));
    p.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.6 + 0.2, (Math.random() - 0.5) * 0.6);
    p.userData.vida = 1.2;
    mundo.add(p);
    particulas.push(p);
  }
}

function actualizarParticulas(dt) {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    p.userData.v.y -= 1.2 * dt;
    p.position.addScaledVector(p.userData.v, dt);
    p.rotation.x += 8 * dt;
    p.rotation.y += 5 * dt;
    p.userData.vida -= dt;
    if (p.userData.vida <= 0) {
      mundo.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      particulas.splice(i, 1);
    }
  }
}

// ---------- bucle ----------
function actualizar(dt) {
  actualizarParticulas(dt);
  if (!estado) return;
  const e = estado;
  const t = reloj.elapsedTime;

  // el Diablo se desliza hacia su carril y tropieza si chocó
  diablo.position.x += (CARRILES[e.carril] - diablo.position.x) * Math.min(1, dt * 10);
  e.tropiezo = Math.max(0, e.tropiezo - dt);
  diablo.rotation.z = e.tropiezo > 0 ? Math.sin(t * 40) * 0.3 : 0;
  if (mixer) mixer.update(e.bailando ? dt : e.jugando ? dt * (e.velocidad / VELOCIDAD_BASE) : 0);
  else if (e.jugando) animarDiabloProcedural(t);

  if (!e.jugando) return;
  texCamino.offset.y += e.velocidad * dt * 1.2;

  for (const ent of e.entidades) {
    ent.z += e.velocidad * dt;
    ent.obj.position.z = ent.z;
    ent.obj.visible = ent.z > Z_APARECE && !ent.tomada;
    if (ent.tipo === 'puerta' && !ent.mostrada && ent.z > Z_APARECE) {
      ent.mostrada = true;
      mostrarPregunta(ent);
    }
    if (!ent.resuelta && ent.z >= Z_DIABLO) {
      ent.resuelta = true;
      if (ent.tipo === 'puerta') resolverPuerta(ent);
      else resolverObjeto(ent);
    }
  }
  // limpia lo que ya pasó
  e.entidades = e.entidades.filter(ent => {
    if (ent.z < Z_SALIDA) return true;
    mundo.remove(ent.obj);
    return false;
  });
}

function animarDiabloProcedural(t) {
  diablo.children.forEach(c => (c.position.y = c.userData.y0 + Math.abs(Math.sin(t * 12)) * 0.015));
}

// ---------- arranque ----------
anchor.onTargetFound = () => {
  marcadorVisible = true;
  ui.escaneo.classList.add('oculto');
  if (!arrancado) { arrancado = true; iniciarPartida(); }
  else if (estado && estado.vidas > 0 && estado.puertasCruzadas < TOTAL_PUERTAS && estado.pausado) {
    estado.pausado = false;
    estado.jugando = true;
  }
};
anchor.onTargetLost = () => {
  marcadorVisible = false;
  ui.escaneo.classList.remove('oculto');
  if (estado?.jugando) { estado.jugando = false; estado.pausado = true; } // pausa hasta volver a ver el marcador
};

$('jugar').addEventListener('click', async () => {
  initAudio();
  sfx('click');
  ui.inicio.classList.add('oculto');
  ui.escaneo.classList.remove('oculto');
  modelos = await cargarModelos();
  diablo = modelos.diablo.objeto;
  diablo.rotation.y = Math.PI; // de espaldas a la cámara, corriendo hacia el fondo
  diablo.children.forEach(c => (c.userData.y0 = c.position.y));
  mundo.add(diablo);
  if (modelos.diablo.clips.length) {
    mixer = new THREE.AnimationMixer(diablo);
    const clips = modelos.diablo.clips;
    acciones.correr = mixer.clipAction(clips.find(c => /sprint|run|corr/i.test(c.name)) || clips[0]);
    const baile = clips.find(c => /dance|baile/i.test(c.name));
    if (baile) acciones.bailar = mixer.clipAction(baile);
    animacion('correr');
  }
  if (DEMO) return iniciarDemo();
  try {
    await mindar.start();
  } catch (err) {
    ui.escaneo.innerHTML = '<p>No se pudo abrir la cámara.<br><small>Revisa los permisos y que la página use HTTPS.</small></p>';
    console.error(err);
    return;
  }
  renderer.setAnimationLoop(() => {
    actualizar(Math.min(reloj.getDelta(), 0.05));
    renderer.render(scene, camera);
  });
});

// Modo demo (?demo): sin cámara, con el marcador dibujado en pantalla.
// Sirve para probar en la computadora y tomar capturas.
function iniciarDemo() {
  const cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.01, 20);
  cam.up.set(0, 0, 1);
  cam.position.set(0, -1.25, 1.1);
  cam.lookAt(0, -0.1, 0);
  const tex = new THREE.TextureLoader().load('marcador/marcador.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  anchor.group.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex })));
  anchor.group.visible = true;
  scene.background = new THREE.Color(0x2b2b2b);
  if (!renderer.domElement.isConnected) $('ar').appendChild(renderer.domElement);
  renderer.setSize(innerWidth, innerHeight);
  anchor.onTargetFound();
  renderer.setAnimationLoop(() => {
    actualizar(Math.min(reloj.getDelta(), 0.05));
    renderer.render(scene, cam);
  });
  // adelanta la simulación N segundos (pruebas automáticas)
  window.avanzar = seg => { for (let i = 0; i < seg * 30; i++) actualizar(1 / 30); };
}

$('otra').addEventListener('click', () => {
  sfx('click');
  if (marcadorVisible) iniciarPartida();
  else { ui.final.classList.add('oculto'); arrancado = false; ui.escaneo.classList.remove('oculto'); }
});
