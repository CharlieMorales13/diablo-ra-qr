# Atrapa al Intruso: un Diablo de Juxtlahuaca corriendo en realidad aumentada 🇲🇽

*Borrador para LinkedIn (≈430 palabras). Agrega el video o GIF antes de publicar.*

---

¿Qué tanto sabes de Oaxaca? Para mi primera actividad de Realidad Virtual y Aumentada hice un minijuego de RA que arranca con un marcador QR que diseñé yo y pone a prueba lo que sabes de la cultura oaxaqueña.

🎯 **Objetivo**
Una experiencia móvil que, al reconocer un marcador propio, despliegue un juego con modelos 3D de uso público y controles táctiles con retroalimentación. En lugar del típico cubo flotando elegí a un **Diablo de Juxtlahuaca**, personaje de las danzas de la Mixteca.

🕹️ **Cómo funciona**
El Diablo se quedó dormido en la Sierra Norte de Juárez y sus compañeros se fueron a la Guelaguetza sin él: tiene que bajar corriendo al Valle de Oaxaca. Al apuntar al marcador, el camino sale del papel y el Diablo espera en alerta. Al tocar «¡A correr!» se voltea y la vista pasa detrás de él, como en Minion Rush. Deslizas el dedo para cambiar de carril y hacia arriba para saltar agaves y cercas de carrizo; el mezcal le da turbo y los Takis suman puntos. Frente a cada una de las 8 puertas se detiene: dos letreros son ciertos y uno es *el intruso*, y hay que cruzar por él. Al final baila mientras recibes un rango de "Turista" a "Oaxaqueño de corazón".

🛠️ **Herramientas**
MindAR para reconocer el marcador, three.js para el 3D, Meshy AI para generar al Diablo con sus animaciones, Blender para bajarlo de 18 MB a 1.5 MB sin romper el rig, modelos CC BY 4.0 de Sketchfab (agave, mezcal, Takis y un camino de grava escaneado), Web Audio API para los efectos de sonido y, de fondo, el *Son Calenda* del Istmo en la versión del Súper Grupo Juárez, y Python con OpenCV para el marcador.

🧩 **Retos**
1. **El marcador.** Un QR solo es muy repetitivo y el rastreador se pierde. Le agregué grecas de Mitla, una muesca asimétrica y tipografía grande, y lo medí con OpenCV hasta unos 9,000 puntos de rastreo.
2. **Las preguntas.** En dificultad media son de cultura general oaxaqueña; en difícil, para oaxaqueños de verdad: días de plaza, magueyes silvestres, el chichilo… Verifiqué cada dato.
3. **Legibilidad.** Los letreros 3D se ven pequeños en el teléfono, así que las opciones también salen en grande, alineadas con los carriles.
4. **Jugar sin estar apuntando.** El marcador solo arranca: el camino se queda frente a la cámara y se juega cómodo, con deslizamientos.

✅ **Resultado**
Una experiencia web que se abre desde el navegador, sin instalar nada, con sonido, vibración y confeti en cada acierto. La mejor excusa para aprender RA y presumir un poco de Oaxaca.

🎥 [video / GIF aquí]
💻 Repositorio: https://github.com/CharlieMorales13/diablo-ra-qr
🔗 Pruébalo: https://diablo-ra-qr.carlos-gomez-dev13.workers.dev/

#RealidadAumentada #WebAR #MindAR #threejs #Oaxaca #Gamificación
