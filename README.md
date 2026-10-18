# Atrapa al Intruso · Diablo RA

Minijuego de **realidad aumentada** para el teléfono que se activa con un **marcador QR de diseño propio**. Al apuntar la cámara al marcador aparece un camino sobre el papel por el que corre un **Diablo de Juxtlahuaca**, personaje de las danzas de Santiago Juxtlahuaca, en la Mixteca oaxaqueña. En cada puerta hay tres letreros sobre cultura oaxaqueña: dos son ciertos y uno es **el intruso**. Hay que cambiar de carril para que el Diablo cruce por el intruso.

> Actividad 1 · Realidad Virtual y Aumentada · 2026

**Pruébalo:** https://diablo-ra-qr.carlos-gomez-dev13.workers.dev/ · **Modo demo en PC:** https://diablo-ra-qr.carlos-gomez-dev13.workers.dev/?demo

![Juego en acción](docs/capturas/juego.png)

## Cómo se juega

| | |
|---|---|
| **Objetivo** | Atrapar al intruso en las 12 puertas. |
| **Reglas** | Cada puerta muestra una pista arriba y 3 opciones abajo. Cambia de carril con ◀ ▶ o tocando la opción. |
| **Puntaje** | Acierto: +100 con combo x2 y x3, y el Diablo acelera. Mazorca: +25. Maguey: −30 y tropiezas. |
| **Vidas** | 3 ❤. Cada intruso que se escapa cuesta una. |
| **Fin** | Al cruzar las 12 puertas o al perder las 3 vidas. El Diablo voltea hacia ti y baila, y se muestra un rango: *Turista*, *Fuereño curioso*, *Paisano* u *Oaxaqueño de corazón*, y el récord del teléfono. |
| **Retroalimentación** | Los botones se encogen y suenan al tocarlos. Un acierto lanza confeti, un acorde y una vibración corta. Un error hace un destello rojo, un zumbido y una vibración doble. Si pierdes el marcador, el juego se pausa. |

El banco tiene **41 preguntas para oaxaqueños**: regiones, los 7 moles, magueyes silvestres, días de plaza, pueblos artesanos, Monte Albán, Guelaguetza, calendas, el carnaval putleco y más. En cada partida salen 12 al azar y, después de cada puerta, aparece un dato curioso.

## Herramientas

- [MindAR](https://github.com/hiukim/mind-ar-js) 1.2.5: rastreo de imagen en el navegador.
- [three.js](https://threejs.org/) 0.160: render 3D y carga de GLB.
- Web Audio API: música y efectos sintetizados en código.
- Vibration API: retroalimentación háptica en Android.
- Python + Pillow + qrcode + OpenCV: generación y análisis del marcador.
- Meshy AI: modelo del Diablo con rig y animaciones.
- Blender 5.2: reducción del Diablo y adaptación de los modelos CC0 de [Kenney](https://kenney.nl).

No hay paso de compilación: es HTML + JavaScript (módulos ES) y las librerías se cargan desde jsDelivr.

## Estructura

```
index.html            pantallas, HUD e import map
css/styles.css        estilos (alto contraste, botones grandes)
js/main.js            escena RA, bucle de juego, controles y retroalimentación
js/preguntas.js       banco de preguntas "atrapa al intruso"
js/modelos.js         carga de GLB con respaldo procedural
js/audio.js           música y efectos con Web Audio
assets/targets.mind   marcador compilado para MindAR
assets/models/        diablo.glb, maguey.glb, mazorca.glb
modelos/              script de Blender que prepara los modelos
marcador/             generador del marcador y compilador de MindAR
```

## Instalación y uso

1. Clona el repositorio:
   ```bash
   git clone https://github.com/CharlieMorales13/diablo-ra-qr.git && cd diablo-ra-qr
   ```
2. Sirve la carpeta con cualquier servidor estático:
   ```bash
   npx serve .
   ```
   La cámara solo funciona con **HTTPS** o en `localhost`. Para probar en el teléfono, publícalo (paso 3) o usa un túnel HTTPS.
3. Publicación: sube la carpeta tal cual a **Vercel** (`vercel deploy`) o a **Cloudflare Pages** (directorio de salida `/`, sin comando de build).
4. Imprime `marcador/marcador.png` (mínimo 10 cm de lado) o ábrelo en otra pantalla.

### Flujo con el marcador

1. **Escanea el QR del marcador** con la cámara normal del teléfono: el QR contiene la URL del juego y abre la página.
2. Toca **Jugar**. Se abre la cámara de RA (el navegador pide permiso una vez).
3. **Apunta al mismo marcador.** En cuanto MindAR lo reconoce, aparece el camino sobre el papel, corre la cuenta regresiva 3, 2, 1 y empieza la partida.
4. Si el marcador sale de cuadro, el juego se pausa y continúa al volver a verlo.

El marcador cumple dos funciones: el QR lleva a la experiencia y el diseño completo (grecas, letras, esquirlas) es la imagen que rastrea MindAR para anclar el juego.

**Modo demo sin cámara:** `index.html?demo` dibuja el marcador en pantalla para probar en la computadora.

### Regenerar el marcador con la URL final

El QR del marcador apunta a la URL del juego. Después de publicar:

```bash
pip install qrcode pillow opencv-python numpy
python marcador/generar_marcador.py https://diablo-ra-qr.carlos-gomez-dev13.workers.dev/ marcador/marcador.png
```

El script imprime los puntos de rastreo, la simetría y si el QR se lee, y guarda un mapa de puntos en `marcador_puntos.png`. Después abre `marcador/compilar.html` desde el servidor, toca **Usar marcador.png** y reemplaza `assets/targets.mind` con el archivo descargado.

**Diseño del marcador:** un QR solo es repetitivo y confunde al rastreador. Por eso lleva un marco con una muesca naranja que rompe la simetría, grecas de Mitla (xicalcoliuhqui) distintas a cada lado, tipografía grande y esquirlas en una sola esquina. Resultado del análisis con la URL publicada: 8,999 puntos ORB, simetría 0.48, 98 % de cobertura y 39 % de los puntos fuera del QR.

### Modelos 3D

| Modelo | Origen | Adaptación en Blender (`modelos/preparar_modelos.py`) | Peso |
|---|---|---|---|
| `diablo.glb` | Diablo de Juxtlahuaca generado con **Meshy AI** a partir de mi prompt, con rig automático y animaciones | Malla de 211 k a 20 k triángulos (se reduce en reposo y conserva los pesos del rig), texturas de 2048 a 1024 px y solo las animaciones `Running` (al correr) y `All_Night_Dance` (pantalla final). De 18 MB a 1.6 MB. | 1.6 MB |
| `maguey.glb` | *Nature Kit 2.1* de Kenney · `plant_flatShort` | Recoloreado en verde azulado de agave | 3 KB |
| `mazorca.glb` | *Food Kit 2.0* de Kenney · `corn` | Textura incrustada en el GLB | 16 KB |

Para regenerarlos, con el GLB de Meshy y los kits de kenney.nl descomprimidos en una carpeta:

```bash
blender --background --python modelos/preparar_modelos.py -- <diablo_meshy.glb> <carpeta_kenney>
```

En el juego cada modelo se escala solo (Diablo 24 cm, maguey 12 cm, mazorca 7 cm en la escala del marcador), la animación de correr se acelera con la velocidad del Diablo y, si faltara un GLB, se usa un respaldo procedural.

## Capturas

| Partida | Pantalla final |
|---|---|
| ![Partida](docs/capturas/juego.png) | ![Final](docs/capturas/final.png) |

## Créditos y licencias

| Recurso | Autor / fuente | Licencia |
|---|---|---|
| Código del juego | Carlos Antonio Gómez Morales | MIT (ver `LICENSE`) |
| Marcador "Atrapa al intruso" | Carlos Antonio Gómez Morales | MIT |
| Diablo de Juxtlahuaca (prompt propio, rig y animaciones) | Generado con [Meshy AI](https://www.meshy.ai), plan gratuito | CC BY 4.0 |
| Maguey (`plant_flatShort`) | [Kenney · Nature Kit](https://kenney.nl/assets/nature-kit) | CC0 1.0 |
| Mazorca (`corn`) | [Kenney · Food Kit](https://kenney.nl/assets/food-kit) | CC0 1.0 |
| Música y efectos | Sintetizados en código (`js/audio.js`), autoría propia | MIT |
| MindAR | HiuKim Yuen | MIT |
| three.js | three.js authors | MIT |
| Tipografías del marcador | Inter (Rasmus Andersson), DejaVu Sans Mono | SIL OFL 1.1 / licencia Bitstream Vera |

Datos culturales consultados en México Desconocido, Secretaría de Turismo de Oaxaca e INAH.
