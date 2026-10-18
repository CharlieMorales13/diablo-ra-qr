# Atrapa al Intruso: un Diablo de Juxtlahuaca corriendo en realidad aumentada 🇲🇽

*Borrador para LinkedIn (≈420 palabras). Agrega el video o GIF y cambia los enlaces antes de publicar.*

---

¿Qué tanto sabes de Oaxaca? Para mi primera actividad de Realidad Virtual y Aumentada hice un minijuego de RA que se activa con un marcador QR que diseñé yo, y que pone a prueba lo que sabes de la cultura oaxaqueña.

🎯 **Objetivo**
Hacer una experiencia móvil que, al reconocer un marcador propio, despliegue un juego con tres modelos 3D y botones táctiles con retroalimentación. Quería algo que no fuera el típico cubo flotando, así que elegí a un **Diablo de Juxtlahuaca**, personaje de las danzas de la Mixteca oaxaqueña.

🕹️ **Cómo funciona**
Al apuntar el teléfono al marcador, en una mesa o pegado en la pared, el Diablo aparece de frente con su animación de alerta. Al tocar «¡A correr!» se voltea, arranca y la vista pasa detrás de él, como en Minion Rush. Deslizas para cambiar de carril y hacia arriba para saltar agaves y cercas de carrizo; una botella de mezcal le da turbo. Cada pocos segundos llega una puerta con tres letreros: dos son ciertos y uno es *el intruso*. Por ejemplo: "¿Qué comparsa NO es del carnaval putleco? Copalas, Mascaritas, Parachicos". Hay 12 puertas, tres dificultades, un tutorial con pausas la primera vez y, al final, un rango de "Turista" a "Oaxaqueño de corazón" mientras el Diablo baila.

🛠️ **Herramientas**
MindAR para el rastreo de imagen en el navegador, three.js para el 3D, Meshy AI para generar al Diablo con su rig y sus animaciones de alerta, correr y bailar, Blender para bajarlo de 18 MB a 1.5 MB sin romper el rig, un agave escaneado, una botella de mezcal y unos Takis de Sketchfab, Web Audio API para la música y los efectos (todo sintetizado en código) y Python con OpenCV para diseñar y analizar el marcador.

🧩 **Retos**
1. **El marcador.** Un QR solo es muy repetitivo y el rastreador se pierde. Le agregué un marco con muesca asimétrica, grecas de Mitla y tipografía grande, y lo medí con OpenCV hasta llegar a unos 9,000 puntos de rastreo con baja simetría.
2. **Las preguntas.** Quería que fueran difíciles de verdad, para oaxaqueños: días de plaza, magueyes silvestres, la Tumba 7 de Monte Albán, el chichilo… Verifiqué cada dato antes de meterlo.
3. **Legibilidad en RA.** Los letreros en 3D se ven pequeños en el teléfono, así que las opciones también aparecen como botones grandes alineados con los carriles.
4. **Pausa inteligente.** Si se pierde el marcador, el juego se detiene en lugar de castigar al jugador.

✅ **Resultado**
Una experiencia web que se abre desde el navegador, sin instalar nada, con sonido, vibración y confeti en cada acierto. Fue la mejor excusa para aprender RA y, de paso, presumir un poco de Oaxaca.

🎥 [video / GIF aquí]
💻 Repositorio: https://github.com/CharlieMorales13/diablo-ra-qr
🔗 Pruébalo: https://diablo-ra-qr.carlos-gomez-dev13.workers.dev/

#RealidadAumentada #WebAR #MindAR #threejs #Oaxaca #DesarrolloWeb #Gamificación
