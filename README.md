# Atrapa al Intruso · Tiliche RA

Minijuego de **realidad aumentada** para el teléfono que se activa con un **marcador QR de diseño propio**. Al apuntar la cámara al marcador aparece un camino sobre el papel por el que corre un **Tiliche**, el personaje del carnaval de Putla Villa de Guerrero, Oaxaca. En cada puerta hay tres letreros sobre cultura oaxaqueña: dos son ciertos y uno es **el intruso**. Hay que cambiar de carril para que el Tiliche cruce por el intruso.

> Actividad 1 · Realidad Virtual y Aumentada · 2026

![Juego en acción](docs/capturas/juego.png)

## Cómo se juega

| | |
|---|---|
| **Objetivo** | Atrapar al intruso en las 12 puertas. |
| **Reglas** | Cada puerta muestra una pista arriba y 3 opciones abajo. Cambia de carril con ◀ ▶ o tocando la opción. |
| **Puntaje** | Acierto: +100 con combo x2 y x3, y el Tiliche acelera. Tlayuda: +25. Maguey: −30 y tropiezas. |
| **Vidas** | 3 ❤. Cada intruso que se escapa cuesta una. |
| **Fin** | Al cruzar las 12 puertas o al perder las 3 vidas. Se muestra un rango: *Turista*, *Fuereño curioso*, *Paisano* u *Oaxaqueño de corazón*, y el récord del teléfono. |
| **Retroalimentación** | Los botones se encogen y suenan al tocarlos. Un acierto lanza confeti, un acorde y una vibración corta. Un error hace un destello rojo, un zumbido y una vibración doble. Si pierdes el marcador, el juego se pausa. |

El banco tiene **41 preguntas para oaxaqueños**: regiones, los 7 moles, magueyes silvestres, días de plaza, pueblos artesanos, Monte Albán, Guelaguetza, calendas, el carnaval putleco y más. En cada partida salen 12 al azar y, después de cada puerta, aparece un dato curioso.

## Herramientas

- [MindAR](https://github.com/hiukim/mind-ar-js) 1.2.5: rastreo de imagen en el navegador.
- [three.js](https://threejs.org/) 0.160: render 3D y carga de GLB.
- Web Audio API: música y efectos sintetizados en código.
- Vibration API: retroalimentación háptica en Android.
- Python + Pillow + qrcode + OpenCV: generación y análisis del marcador.
- [Meshy](https://www.meshy.ai/): generación de los modelos 3D.

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
assets/models/        tiliche.glb, maguey.glb, tlayuda.glb
marcador/             generador del marcador y compilador de MindAR
```

## Instalación y uso

1. Clona el repositorio:
   ```bash
   git clone <url-del-repo> && cd 01-tiliche-ra-qr
   ```
2. Sirve la carpeta con cualquier servidor estático:
   ```bash
   npx serve .
   ```
   La cámara solo funciona con **HTTPS** o en `localhost`. Para probar en el teléfono, publícalo (paso 3) o usa un túnel HTTPS.
3. Publicación: sube la carpeta tal cual a **Vercel** (`vercel deploy`) o a **Cloudflare Pages** (directorio de salida `/`, sin comando de build).
4. Imprime `marcador/marcador.png` (mínimo 10 cm de lado) o ábrelo en otra pantalla, abre la página en Chrome para Android, toca **Jugar** y apunta al marcador.

**Modo demo sin cámara:** `index.html?demo` dibuja el marcador en pantalla para probar en la computadora.

### Regenerar el marcador con la URL final

El QR del marcador apunta a la URL del juego. Después de publicar:

```bash
pip install qrcode pillow opencv-python numpy
python marcador/generar_marcador.py https://TU-URL marcador/marcador.png
```

El script imprime los puntos de rastreo, la simetría y si el QR se lee, y guarda un mapa de puntos en `marcador_puntos.png`. Después abre `marcador/compilar.html` desde el servidor, toca **Usar marcador.png** y reemplaza `assets/targets.mind` con el archivo descargado.

**Diseño del marcador:** un QR solo es repetitivo y confunde al rastreador. Por eso lleva un marco con una muesca naranja que rompe la simetría, grecas de Mitla (xicalcoliuhqui) distintas a cada lado, tipografía grande y esquirlas en una sola esquina. Resultado del análisis: unos 8,900 puntos ORB, simetría 0.50 y 98 % de cobertura, con más de la mitad de los puntos fuera del QR.

### Modelos 3D

El juego carga `assets/models/tiliche.glb`, `maguey.glb` y `tlayuda.glb`. Si falta alguno, usa un modelo procedural hecho con primitivas de three.js, así que siempre funciona. Si el GLB del Tiliche trae una animación cuyo nombre contiene *run*, se reproduce al ritmo de la velocidad del juego. Cada modelo se escala solo (Tiliche 24 cm, maguey 12 cm y tlayuda 3 cm en la escala del marcador) y pesa menos de 5 MB.

## Capturas

| Partida | Pantalla final |
|---|---|
| ![Partida](docs/capturas/juego.png) | ![Final](docs/capturas/final.png) |

## Créditos y licencias

| Recurso | Autor / fuente | Licencia |
|---|---|---|
| Código del juego | Carlos Antonio Gómez Morales | MIT (ver `LICENSE`) |
| Marcador "Atrapa al intruso" | Carlos Antonio Gómez Morales | MIT |
| Modelo 3D Tiliche (`tiliche.glb`) | Generado en Meshy AI por Carlos Gómez | CC BY 4.0 (Meshy, plan gratuito) |
| Modelo 3D Maguey (`maguey.glb`) | Generado en Meshy AI por Carlos Gómez | CC BY 4.0 (Meshy, plan gratuito) |
| Modelo 3D Tlayuda (`tlayuda.glb`) | Generado en Meshy AI por Carlos Gómez | CC BY 4.0 (Meshy, plan gratuito) |
| Música y efectos | Sintetizados en código (`js/audio.js`), autoría propia | MIT |
| MindAR | HiuKim Yuen | MIT |
| three.js | three.js authors | MIT |
| Tipografías del marcador | Inter (Rasmus Andersson), DejaVu Sans Mono | SIL OFL 1.1 / licencia Bitstream Vera |

Datos culturales consultados en México Desconocido, Secretaría de Turismo de Oaxaca e INAH.
