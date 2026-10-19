import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { PREGUNTAS } from './preguntas.js';
import { initAudio, sfx, startMusic, stopMusic, vibrar } from './audio.js';
import { cargarModelos } from './modelos.js';

// ---------- configuración ----------
const CARRILES = [-0.22, 0, 0.22];
const Z_DIABLO = 0.3;       // donde corre el Diablo (lado cercano del marcador)
const Z_APARECE = -1.7;     // horizonte: más lejos de esto los objetos no se ven
const Z_SALIDA = 0.65;
const TOTAL_PUERTAS = 12;
const SALTO = { alto: 0.13, duracion: 0.62 };
const TURBO = { duracion: 4, factor: 1.6, puntos: 50 }; // botella de mezcal
const PROB_MEZCAL = 0.3; // por tramo
const ESCALA_INTRO = 1.6;   // de frente y de cerca antes de arrancar
// El marcador solo inicia el juego: al verlo, el camino sale del papel y se
// queda fijo frente a la cámara. Así se juega aunque el marcador salga de cuadro.
// Posición de la cámara respecto al camino, en anchos de marcador.
const VISTA = { altura: 1.1, atras: 1.25, mira: 0.1 }; // ponytail: encuadre fijo, se ajusta aquí
const DESPEGUE = 0.9; // segundos que tarda el camino en salir del marcador
const VELOCIDAD_ANIMACION = 0.32; // velocidad a la que la animación de correr se ve natural
const DIFICULTADES = {
  media: { nombre: 'Media', velocidad: 0.32, aceleracion: 1.04, vidas: 3, obstaculos: 2, valla: 0.35 },
  dificil: { nombre: 'Difícil', velocidad: 0.42, aceleracion: 1.05, vidas: 3, obstaculos: 3, valla: 0.6 },
  'muy-dificil': { nombre: 'Muy difícil', velocidad: 0.54, aceleracion: 1.06, vidas: 2, obstaculos: 4, valla: 0.85 },
};
const DEMO = new URLSearchParams(location.search).has('demo');

// ---------- tutorial ----------
// Cada paso muestra una tarjeta. `crear` manda un objeto por el camino; cuando
// llega a `cuando` (distancia al Diablo, o 'visible') el juego se pausa hasta
// que el jugador hace la acción de `espera` o toca el botón.
const VELOCIDAD_TUTORIAL = 0.25;
const PREGUNTA_TUTORIAL = {
  pista: 'Moles: ¿cuál es el intruso?',
  opciones: ['Mole negro', 'Coloradito', 'Mole poblano'],
  intruso: 2,
  dato: 'El mole poblano es de Puebla. Oaxaca presume siete moles.',
};
const TUTORIAL = [
  { texto: 'Él es el <b>Diablo de Juxtlahuaca</b>. Se quedó dormido en la <b>Sierra Norte de Juárez</b> y sus compañeros se fueron en los camiones a la <b>Guelaguetza</b>. Ayúdalo a bajar corriendo por el camino de tierra al Valle de Oaxaca.', boton: 'Siguiente' },
  { texto: 'Cuando estés listo toca <b>¡A correr!</b>: se voltea y la vista se pone detrás de él.', espera: 'arranque' },
  { texto: 'Vienen unos <b>Takis</b> que valen 25 puntos. Desliza el dedo a la <b>izquierda</b> para ir por ellos.', crear: { tipo: 'takis', carril: 0 }, cuando: 0.45, espera: 'carril', carril: 0 },
  { texto: 'Un <b>maguey</b> en tu carril. Desliza el dedo hacia <b>arriba</b> para saltar.', crear: { tipo: 'maguey' }, cuando: 0.11, espera: 'salto' },
  { texto: 'La <b>cerca de carrizo</b> tapa los tres carriles: solo se puede saltar.', crear: { tipo: 'valla' }, cuando: 0.11, espera: 'salto' },
  { texto: 'Llega una <b>puerta</b>. Arriba está la pista y abajo las 3 opciones: dos son ciertas y una es el <b>intruso</b>.', crear: { tipo: 'puerta' }, cuando: 'visible', boton: 'Entendido' },
  { texto: 'Cruza por el intruso: desliza el dedo hasta su carril.', mismo: true, cuando: 0.5, espera: 'carril', carril: 'intruso' },
  { texto: '¡Muy bien! Cada acierto suma 100 puntos, sube el combo y acelera al Diablo. Ahora elige tu dificultad.', boton: 'Elegir dificultad', fin: true },
];

// ---------- ajustes guardados ----------
function leer(clave, valor) { try { return localStorage.getItem(clave) ?? valor; } catch { return valor; } }
function guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch { /* sin almacenamiento */ } }
const ajustes = {
  dificultad: DIFICULTADES[leer('diablo-dificultad')] ? leer('diablo-dificultad') : 'media',
};

const $ = id => document.getElementById(id);
const ui = {
  hud: $('hud'), vidas: $('vidas'), puerta: $('puerta'), puntos: $('puntos'),
  pista: $('pista'), aviso: $('aviso'), escaneo: $('escaneo'), cuenta: $('cuenta'),
  inicio: $('inicio'), final: $('final'), rango: $('rango'), resumen: $('resumen'), record: $('record'),
  tarjeta: $('tarjeta'), tarjetaTexto: $('tarjeta-texto'), tarjetaBoton: $('tarjeta-boton'),
  correr: $('correr'), recorrido: $('recorrido'), llegada: $('llegada'),
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
// El marcador vive en el plano XY. `mundo` trabaja con Y hacia arriba y el
// camino corriendo por Z (lejos = -Z, cerca de la cámara = +Z).
const mundo = new THREE.Group();
mundo.rotation.x = Math.PI / 2;
anchor.group.add(mundo);
// `contenido` se escala alrededor del Diablo para la toma de frente del inicio.
const contenido = new THREE.Group();
mundo.add(contenido);

// Al ver el marcador por primera vez, `mundo` deja el ancla y viaja del papel
// a una pose fija frente a la cámara.
const desde = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() };
const hasta = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() };
let despegue = 1;

function liberarMundo(cam) {
  scene.attach(mundo); // conserva la pose que tiene sobre el papel
  desde.p.copy(mundo.position); desde.q.copy(mundo.quaternion); desde.s.copy(mundo.scale);
  // la cámara queda detrás y arriba del Diablo, como en tercera persona
  const ojo = new THREE.Vector3(0, VISTA.altura, VISTA.atras);
  const pose = new THREE.Matrix4().lookAt(ojo, new THREE.Vector3(0, 0, VISTA.mira), new THREE.Vector3(0, 1, 0)).setPosition(ojo).invert();
  const s = desde.s.x; // tamaño del marcador en unidades de la escena
  cam.updateMatrixWorld();
  pose.premultiply(new THREE.Matrix4().makeScale(s, s, s)).premultiply(cam.matrixWorld).decompose(hasta.p, hasta.q, hasta.s);
  despegue = 0;
}

function moverDespegue(dt) {
  despegue = Math.min(1, despegue + dt / DESPEGUE);
  const k = suave(despegue);
  mundo.position.lerpVectors(desde.p, hasta.p, k);
  mundo.quaternion.slerpQuaternions(desde.q, hasta.q, k);
  mundo.scale.lerpVectors(desde.s, hasta.s, k);
}

function vista(escala) {
  contenido.scale.setScalar(escala);
  contenido.position.z = Z_DIABLO * (1 - escala);
}

// camino de tierra con líneas que se desplazan
const texCamino = crearTexturaCamino();
const camino = new THREE.Mesh(
  new THREE.PlaneGeometry(0.72, 2.6),
  new THREE.MeshStandardMaterial({ map: texCamino, transparent: true, opacity: 0.95 }),
);
camino.rotation.x = -Math.PI / 2;
camino.position.set(0, 0.001, -0.65);
contenido.add(camino);

// ---------- estado ----------
let modelos = null;
let diablo = null;
let mixer = null;
const acciones = {}; // alerta, correr y bailar
let accionActual = null;
let estado = null;
let libre = false; // el marcador ya inició el juego
let arrancado = false;
let quiereTutorial = false;
let camaraDemo = null;
const particulas = [];
const reloj = new THREE.Clock();

function nuevoEstado(tutorial) {
  const dif = DIFICULTADES[ajustes.dificultad];
  return {
    fase: 'intro', // intro → transicion → jugando → fin
    tutorial,
    tut: null,
    dif,
    pausaTutorial: false,
    vidas: dif.vidas,
    puntos: 0,
    combo: 1,
    aciertos: 0,
    puertasCruzadas: 0,
    velocidad: tutorial ? VELOCIDAD_TUTORIAL : dif.velocidad,
    carril: 1,
    tropiezo: 0,
    salto: 0,
    turbo: 0,
    transicion: 0,
    entidades: [],
    bolsa: barajar([...PREGUNTAS]).slice(0, TOTAL_PUERTAS),
    puertaActual: null,
  };
}

const corriendo = () => estado?.fase === 'jugando' && !estado.pausaTutorial;
const tutorialVisto = () => leer('diablo-tutorial') === '1';

// ---------- utilidades ----------
function barajar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const suave = t => t * t * (3 - 2 * t);

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
  t.repeat.set(1, 3);
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
function crearPuerta(pregunta, z, ultima = false) {
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
  if (ultima) { // la entrada al Valle: la Guelaguetza
    const meta = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.1), new THREE.MeshBasicMaterial({ map: texturaLetrero('¡GUELAGUETZA!') }));
    meta.position.y = 0.28;
    g.add(meta);
  }
  return { tipo: 'puerta', obj: g, z, pregunta, opciones, intruso, resuelta: false };
}

function crearObjeto(tipo, z, carril = Math.floor(Math.random() * 3)) {
  const obj = modelos[tipo].clone();
  if (tipo === 'valla') carril = null; // ocupa los tres carriles
  else obj.position.x = CARRILES[carril];
  return { tipo, obj, z, carril, resuelta: false };
}

function agregar(ent) {
  ent.obj.visible = false;
  ent.obj.position.z = ent.z;
  contenido.add(ent.obj);
  estado.entidades.push(ent);
  return ent;
}

// Un tramo: agaves (con Takis de premio), a veces una cerca y un mezcal, y la
// puerta. Antes de la puerta queda todo el camino visible despejado: cuando
// asoma la pregunta ya no hay obstáculos y el jugador solo piensa en responder.
const DESPEJE = Z_DIABLO - Z_APARECE;

function programarTramo(zInicio) {
  const e = estado;
  const indice = e.puertasCruzadas + e.entidades.filter(x => x.tipo === 'puerta' && !x.resuelta).length;
  if (indice >= TOTAL_PUERTAS) return;
  let z = zInicio;
  for (let i = 0; i < e.dif.obstaculos; i++) {
    agregar(crearObjeto('maguey', z));
    if (Math.random() < 0.6) agregar(crearObjeto('takis', z - 0.2));
    z -= 0.4;
  }
  if (Math.random() < e.dif.valla) {
    agregar(crearObjeto('valla', z));
    z -= 0.4;
  }
  if (Math.random() < PROB_MEZCAL) {
    agregar(crearObjeto('mezcal', z + 0.15));
    z -= 0.15;
  }
  agregar(crearPuerta(e.bolsa[indice], z - DESPEJE, indice === TOTAL_PUERTAS - 1));
}

// ---------- flujo de partida ----------
function animacion(nombre) { // transición suave entre alerta, correr y bailar
  const nueva = acciones[nombre];
  if (!nueva || nueva === accionActual) return;
  accionActual?.fadeOut(0.4);
  nueva.reset().fadeIn(0.4).play();
  accionActual = nueva;
}

function limpiarEntidades() {
  document.body.classList.remove('turbo');
  if (estado) for (const ent of estado.entidades) contenido.remove(ent.obj);
}

// El Diablo espera de frente, en primer plano, con su animación de alerta.
function prepararSalida(tutorial) {
  limpiarEntidades();
  estado = nuevoEstado(tutorial);
  diablo.position.set(CARRILES[1], 0, Z_DIABLO);
  diablo.rotation.set(0, 0, 0);
  diablo.scale.setScalar(1);
  vista(ESCALA_INTRO);
  animacion(acciones.alerta ? 'alerta' : 'correr');
  ui.final.classList.add('oculto');
  ui.hud.classList.remove('oculto');
  ui.pista.classList.add('oculto');
  ui.aviso.classList.add('oculto');
  ui.opciones.forEach(b => (b.textContent = ''));
  actualizarHUD();
  if (tutorial) entrarPaso(0);
  else {
    ui.correr.classList.remove('oculto');
    mostrarTarjeta(`¡Te dormiste y los camiones ya se fueron a la Guelaguetza! Baja de la Sierra Norte al valle. Dificultad <b>${estado.dif.nombre}</b>: toca <b>¡A correr!</b>`);
  }
}

// Al tocar ¡A correr!: se voltea, empieza a correr y la vista pasa detrás de él.
function arrancar() {
  const e = estado;
  if (!e || e.fase !== 'intro') return;
  if (e.tutorial && TUTORIAL[e.tut.i].espera !== 'arranque') return;
  e.fase = 'transicion';
  ui.correr.classList.add('oculto');
  ocultarTarjeta();
  animacion('correr');
  sfx('correcto');
  vibrar(20);
  tutorialAccion('arranque');
}

function empezarACorrer() {
  const e = estado;
  e.fase = 'jugando';
  diablo.rotation.y = Math.PI;
  vista(1);
  ui.cuenta.textContent = '¡Corre!';
  ui.cuenta.classList.remove('oculto');
  setTimeout(() => ui.cuenta.classList.add('oculto'), 700);
  startMusic();
  if (!e.tutorial) programarTramo(-1.0);
}

function terminar() {
  const e = estado;
  e.fase = 'fin';
  document.body.classList.remove('turbo');
  stopMusic();
  sfx('fin');
  if (acciones.bailar) { // el Diablo voltea hacia ti y baila
    e.carril = 1;
    for (const ent of e.entidades) ent.obj.visible = false; // despeja el camino
    diablo.rotation.y = 0;
    diablo.scale.setScalar(1.6);
    animacion('bailar');
  }
  ui.hud.classList.add('oculto');
  const a = e.aciertos;
  const rango = a >= 10 ? 'Oaxaqueño de corazón' : a >= 7 ? 'Paisano' : a >= 4 ? 'Fuereño curioso' : 'Turista';
  const clave = `diablo-record-${ajustes.dificultad}`;
  const record = Math.max(e.puntos, Number(leer(clave)) || 0);
  guardar(clave, record);
  const llego = e.vidas > 0 && e.puertasCruzadas >= TOTAL_PUERTAS;
  ui.llegada.textContent = llego ? '¡Llegaste a tiempo a la Guelaguetza!' : 'Te quedaste en el camino y no llegaste a la Guelaguetza.';
  ui.rango.textContent = rango;
  ui.resumen.textContent = `${a} de ${TOTAL_PUERTAS} intrusos atrapados · ${e.puntos} puntos · ${e.dif.nombre}`;
  ui.record.textContent = `Récord en ${e.dif.nombre.toLowerCase()}: ${record}`;
  ui.final.classList.remove('oculto');
}

function revisarFin() {
  const e = estado;
  if (e.tutorial || (e.vidas > 0 && e.puertasCruzadas < TOTAL_PUERTAS)) return;
  e.fase = 'cerrando';
  setTimeout(terminar, 1800);
}

function perderVida(titulo, dato) {
  const e = estado;
  if (!e.tutorial) e.vidas--;
  e.combo = 1;
  e.tropiezo = 0.6;
  sfx('error');
  vibrar([80, 40, 80]);
  flashRojo();
  mostrarAviso(false, titulo, dato);
}

function resolverPuerta(p) {
  const e = estado;
  e.puertasCruzadas++;
  e.velocidad *= 1.015; // cada puerta se corre un poco más rápido
  if (e.carril === p.intruso) {
    e.aciertos++;
    e.puntos += 100 * e.combo;
    e.combo = Math.min(e.combo + 1, 3);
    e.velocidad *= e.dif.aceleracion;
    sfx('correcto');
    vibrar(30);
    confeti(0xffc300);
    mostrarAviso(true, '¡Intruso atrapado!', p.pregunta.dato);
  } else {
    perderVida(`El intruso era: ${p.opciones[p.intruso]}`, p.pregunta.dato);
  }
  ui.pista.classList.add('oculto');
  ui.opciones.forEach(b => (b.textContent = ''));
  e.puertaActual = null;
  actualizarHUD();
  revisarFin();
}

function resolverObjeto(o) {
  const e = estado;
  const libre = e.salto > 0 || e.turbo > 0; // saltando o con turbo no choca
  if (o.tipo === 'valla') {
    if (libre) { e.puntos += 10; sfx('moneda'); }
    else perderVida('¡La cerca!', 'Las cercas de carrizo solo se pasan saltando.');
  } else if (o.carril !== e.carril) {
    return;
  } else if (o.tipo === 'takis') {
    e.puntos += 25;
    sfx('moneda');
    vibrar(15);
    confeti(0xd8b46a);
    o.tomada = true;
  } else if (o.tipo === 'mezcal') { // turbo: corre más rápido y atraviesa obstáculos
    e.puntos += TURBO.puntos;
    e.turbo = TURBO.duracion;
    document.body.classList.add('turbo');
    sfx('correcto');
    vibrar([20, 30, 20]);
    confeti(0xffffff);
    mostrarAviso(true, '¡Mezcal! Turbo', `+${TURBO.puntos} y ${TURBO.duracion} s atravesando todo.`);
    o.tomada = true;
  } else if (!libre) { // maguey
    e.puntos = Math.max(0, e.puntos - 30);
    e.tropiezo = 0.6;
    sfx('golpe');
    vibrar(120);
    flashRojo();
  }
  actualizarHUD();
  revisarFin();
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
  avisoTimer = setTimeout(() => ui.aviso.classList.add('oculto'), 2600);
}

function mostrarTarjeta(html, boton) {
  ui.tarjetaTexto.innerHTML = html; // textos fijos del juego, no del usuario
  ui.tarjetaBoton.textContent = boton ?? '';
  ui.tarjetaBoton.classList.toggle('oculto', !boton);
  ui.tarjeta.classList.remove('oculto');
}

function ocultarTarjeta() { ui.tarjeta.classList.add('oculto'); }

function flashRojo() {
  document.body.classList.remove('flash-rojo');
  void document.body.offsetWidth; // reinicia la animación CSS
  document.body.classList.add('flash-rojo');
}

function actualizarHUD() {
  const e = estado;
  ui.vidas.textContent = '❤'.repeat(Math.max(0, e.vidas)) + '♡'.repeat(Math.max(0, e.dif.vidas - e.vidas));
  ui.puerta.textContent = e.tutorial ? 'Tutorial' : `Puerta ${Math.min(e.puertasCruzadas + 1, TOTAL_PUERTAS)}/${TOTAL_PUERTAS}`;
  ui.puntos.textContent = e.puntos + (e.combo > 1 ? ` x${e.combo}` : '');
  ui.recorrido.style.width = `${(e.puertasCruzadas / TOTAL_PUERTAS) * 100}%`;
  ui.opciones.forEach((b, i) => b.classList.toggle('activa', i === e.carril));
}

// ---------- tutorial ----------
function entrarPaso(i) {
  const e = estado;
  const p = TUTORIAL[i];
  e.tut = { i, ent: p.mismo ? e.tut.ent : null, pausado: false, listo: false };
  if (p.crear) {
    const { tipo, carril = e.carril } = p.crear;
    e.tut.ent = agregar(tipo === 'puerta' ? crearPuerta(PREGUNTA_TUTORIAL, -1.9) : crearObjeto(tipo, -1.2, carril));
  }
  if (p.crear || p.mismo) ocultarTarjeta(); // la tarjeta sale cuando el objeto llega
  else mostrarTarjeta(p.texto, p.boton);
  ui.correr.classList.toggle('oculto', p.espera !== 'arranque');
}

function revisarPausaTutorial() {
  const e = estado;
  const tut = e.tut;
  const p = TUTORIAL[tut.i];
  if (!tut.ent || tut.pausado || tut.listo || !p.cuando) return;
  const llego = p.cuando === 'visible' ? tut.ent.z > Z_APARECE : tut.ent.z >= Z_DIABLO - p.cuando;
  if (!llego) return;
  tut.pausado = true;
  e.pausaTutorial = true;
  mostrarTarjeta(p.texto, p.boton);
  if (p.espera === 'carril' && e.carril === metaCarril(p)) programarTutorial(1.5, () => tutorialAccion('carril')); // ya estaba ahí
}

function programarTutorial(segundos, fn) {
  estado.tut.reloj = segundos;
  estado.tut.alVencer = fn;
}

const metaCarril = p => (p.carril === 'intruso' ? estado.tut.ent.intruso : p.carril);

function tutorialAccion(tipo) {
  const e = estado;
  if (!e?.tutorial || !e.tut || e.tut.listo) return;
  const p = TUTORIAL[e.tut.i];
  if (p.espera !== tipo) return;
  if (tipo !== 'arranque' && !e.tut.pausado) return; // cuenta cuando ya se explicó
  if (tipo === 'carril' && e.carril !== metaCarril(p)) return;
  completarPaso();
}

function completarPaso() {
  const e = estado;
  e.tut.listo = true;
  e.pausaTutorial = false;
  ocultarTarjeta();
  // sin objeto en camino, o si el siguiente paso usa el mismo, avanza ya;
  // si no, avanza cuando el objeto pase junto al Diablo
  if (!e.tut.ent || TUTORIAL[e.tut.i + 1]?.mismo) siguientePaso();
}

function siguientePaso() {
  entrarPaso(estado.tut.i + 1);
}

function terminarTutorial() {
  guardar('diablo-tutorial', '1');
  stopMusic();
  limpiarEntidades();
  estado = null;
  ui.hud.classList.add('oculto');
  abrirMenu();
}

ui.tarjetaBoton.addEventListener('click', () => {
  const e = estado;
  if (!e?.tutorial) return;
  sfx('click');
  const p = TUTORIAL[e.tut.i];
  if (p.fin) return terminarTutorial();
  if (e.tut.ent && !e.tut.pausado) return;
  completarPaso();
});

// ---------- controles táctiles ----------
function puedeMoverse() {
  return corriendo() || (estado?.pausaTutorial && TUTORIAL[estado.tut.i].espera === 'carril');
}

function moverA(carril) {
  if (!puedeMoverse()) return;
  const nuevo = Math.max(0, Math.min(2, carril));
  if (nuevo === estado.carril) return;
  estado.carril = nuevo;
  sfx('click');
  vibrar(10);
  actualizarHUD();
  tutorialAccion('carril');
}

function saltar() {
  const e = estado;
  const esperandoSalto = e?.pausaTutorial && TUTORIAL[e.tut.i].espera === 'salto';
  if (!e || e.salto > 0 || !(corriendo() || esperandoSalto)) return;
  tutorialAccion('salto'); // primero reanuda, luego salta
  e.salto = SALTO.duracion;
  sfx('salto');
  vibrar(15);
}

ui.correr.addEventListener('click', arrancar);
window.addEventListener('keydown', e => {
  if (!estado) return;
  if (e.key === 'ArrowLeft') moverA(estado.carril - 1);
  if (e.key === 'ArrowRight') moverA(estado.carril + 1);
  if (e.key === 'ArrowUp' || e.key === ' ') saltar();
});

// Sin botones: se juega deslizando el dedo. ← → cambia de carril, ↑ salta.
// Responde en cuanto el dedo recorre unos píxeles, sin esperar a soltarlo.
let toque = null;
window.addEventListener('pointerdown', e => {
  toque = e.target.closest('button, .pantalla, #tarjeta') ? null : { x: e.clientX, y: e.clientY };
});
window.addEventListener('pointermove', e => {
  if (!toque || !estado) return;
  const dx = e.clientX - toque.x;
  const dy = e.clientY - toque.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  toque = null; // un movimiento por deslizamiento
  if (Math.abs(dx) > Math.abs(dy)) moverA(estado.carril + Math.sign(dx));
  else if (dy < 0) saltar();
});
window.addEventListener('pointerup', () => (toque = null));

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
    contenido.add(p);
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
      contenido.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      particulas.splice(i, 1);
    }
  }
}

// ---------- bucle ----------
const velocidadReal = e => e.velocidad * (e.turbo > 0 ? TURBO.factor : 1);

function velocidadAnimacion(e) {
  if (e.fase !== 'jugando' && e.fase !== 'cerrando') return 1;
  if (e.pausaTutorial) return 0.15; // cámara lenta mientras se explica
  return Math.min(2.5, velocidadReal(e) / VELOCIDAD_ANIMACION);
}

function actualizar(dt) {
  if (despegue < 1) moverDespegue(dt);
  actualizarParticulas(dt);
  if (!estado) return;
  const e = estado;
  const t = reloj.elapsedTime;

  if (e.fase === 'transicion') {
    e.transicion = Math.min(1, e.transicion + dt / 1.1);
    const k = suave(e.transicion);
    diablo.rotation.y = Math.PI * k;
    vista(ESCALA_INTRO + (1 - ESCALA_INTRO) * k);
    if (e.transicion === 1) empezarACorrer();
  }

  // se desliza hacia su carril, salta en arco y tropieza si chocó
  diablo.position.x += (CARRILES[e.carril] - diablo.position.x) * Math.min(1, dt * 12);
  e.tropiezo = Math.max(0, e.tropiezo - dt);
  diablo.rotation.z = e.tropiezo > 0 ? Math.sin(t * 40) * 0.3 : 0;
  if (corriendo() && e.salto > 0) e.salto = Math.max(0, e.salto - dt);
  if (corriendo() && e.turbo > 0) {
    e.turbo = Math.max(0, e.turbo - dt);
    if (e.turbo === 0) document.body.classList.remove('turbo');
  }
  // relojes del tutorial en tiempo de juego (no en tiempo real)
  if (e.tut?.reloj > 0) {
    e.tut.reloj -= dt;
    if (e.tut.reloj <= 0) e.tut.alVencer();
  }
  diablo.position.y = e.salto > 0 ? SALTO.alto * Math.sin(Math.PI * (1 - e.salto / SALTO.duracion)) : 0;
  if (mixer) mixer.update(dt * velocidadAnimacion(e));
  else if (corriendo()) animarDiabloProcedural(t);

  if (!corriendo()) return;
  const v = velocidadReal(e);
  texCamino.offset.y += v * dt * 1.2;

  for (const ent of e.entidades) {
    ent.z += v * dt;
    ent.obj.position.z = ent.z;
    ent.obj.visible = ent.z > Z_APARECE && !ent.tomada;
    if (ent.tipo === 'puerta' && !ent.vista && ent.z > Z_APARECE) {
      ent.vista = true;
      if (!e.tutorial) programarTramo(ent.z - 0.5); // el siguiente tramo empieza detrás de esta puerta
    }
    if (!ent.resuelta && ent.z >= Z_DIABLO) {
      ent.resuelta = true;
      if (ent.tipo === 'puerta') resolverPuerta(ent);
      else resolverObjeto(ent);
      if (e.tutorial && ent === e.tut.ent && e.tut.listo) programarTutorial(0.9, siguientePaso);
    }
  }
  // la pregunta en pantalla es la de la puerta más cercana que ya se ve
  if (!e.puertaActual) {
    const p = e.entidades.find(x => x.tipo === 'puerta' && !x.resuelta && x.vista);
    if (p) mostrarPregunta(p);
  }
  if (e.tutorial) revisarPausaTutorial();
  // limpia lo que ya pasó
  e.entidades = e.entidades.filter(ent => {
    if (ent.z < Z_SALIDA) return true;
    contenido.remove(ent.obj);
    return false;
  });
}

function animarDiabloProcedural(t) {
  diablo.children.forEach(c => (c.position.y = c.userData.y0 + Math.abs(Math.sin(t * 12)) * 0.015));
}

// ---------- menú: dificultad ----------
for (const input of document.querySelectorAll('.selector input')) {
  input.checked = ajustes[input.name] === input.value;
  input.addEventListener('change', () => {
    ajustes[input.name] = input.value;
    guardar(`diablo-${input.name}`, input.value);
    sfx('click');
  });
}

function abrirMenu() {
  ui.final.classList.add('oculto');
  ui.inicio.classList.remove('oculto');
  $('jugar').textContent = 'Jugar';
}

// ---------- arranque ----------
anchor.onTargetFound = () => {
  if (libre) return;
  libre = true;
  ui.escaneo.classList.add('oculto');
  liberarMundo(camaraDemo ?? camera);
  if (!camaraDemo) mindar.pause?.(true); // ya no se rastrea: sigue la cámara y ahorra batería
  prepararSalida(quiereTutorial);
};

async function empezar(tutorial) {
  initAudio();
  sfx('click');
  ui.inicio.classList.add('oculto');
  quiereTutorial = tutorial;
  limpiarEntidades();
  estado = null;
  if (arrancado) { // la cámara ya está abierta
    if (libre) prepararSalida(tutorial);
    else ui.escaneo.classList.remove('oculto');
    return;
  }
  arrancado = true;
  ui.escaneo.classList.remove('oculto');
  modelos = await cargarModelos();
  diablo = modelos.diablo.objeto;
  diablo.children.forEach(c => (c.userData.y0 = c.position.y));
  contenido.add(diablo);
  if (modelos.diablo.clips.length) {
    mixer = new THREE.AnimationMixer(diablo);
    const clips = modelos.diablo.clips;
    acciones.correr = mixer.clipAction(clips.find(c => /sprint|run|corr/i.test(c.name)) || clips[0]);
    const alerta = clips.find(c => /alert/i.test(c.name));
    if (alerta) acciones.alerta = mixer.clipAction(alerta);
    const baile = clips.find(c => /dance|baile/i.test(c.name));
    if (baile) acciones.bailar = mixer.clipAction(baile);
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
}

$('jugar').addEventListener('click', () => empezar(!tutorialVisto()));
$('tutorial').addEventListener('click', () => empezar(true));
$('otra').addEventListener('click', () => {
  sfx('click');
  prepararSalida(false);
});
$('menu').addEventListener('click', () => {
  sfx('click');
  stopMusic();
  limpiarEntidades();
  estado = null;
  abrirMenu();
});

// Modo demo (?demo): sin cámara, con el marcador dibujado en pantalla.
// Sirve para probar en la computadora y tomar capturas.
function iniciarDemo() {
  camaraDemo = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.01, 20);
  camaraDemo.position.set(0, -1.6, 1.6); // mirando el marcador sobre la mesa
  camaraDemo.lookAt(0, 0, 0);
  const tex = new THREE.TextureLoader().load('marcador/marcador.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  // sin depthWrite: como en la cámara real, el papel no tapa lo que está "detrás" del muro
  anchor.group.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, depthWrite: false })));
  anchor.group.visible = true;
  scene.background = new THREE.Color(0x2b2b2b);
  if (!renderer.domElement.isConnected) $('ar').appendChild(renderer.domElement);
  renderer.setSize(innerWidth, innerHeight);
  anchor.onTargetFound();
  renderer.setAnimationLoop(() => {
    actualizar(Math.min(reloj.getDelta(), 0.05));
    renderer.render(scene, camaraDemo);
  });
  // pruebas automáticas: adelanta la simulación N segundos
  window.avanzar = seg => { for (let i = 0; i < seg * 30; i++) actualizar(1 / 30); };
  window.juego = () => estado;
}
