# Atrapa al Intruso: un Tiliche de Putla corriendo en realidad aumentada 🇲🇽

*Borrador para LinkedIn (≈420 palabras). Agrega el video o GIF y cambia los enlaces antes de publicar.*

---

¿Qué tanto sabes de Oaxaca? Para mi primera actividad de Realidad Virtual y Aumentada hice un minijuego de RA que se activa con un marcador QR que diseñé yo, y que pone a prueba lo que sabes de la cultura oaxaqueña.

🎯 **Objetivo**
Hacer una experiencia móvil que, al reconocer un marcador propio, despliegue un juego con tres modelos 3D y botones táctiles con retroalimentación. Quería algo que no fuera el típico cubo flotando, así que elegí al **Tiliche**, el personaje del carnaval de Putla Villa de Guerrero, con su traje de retazos de tela que vuela al bailar.

🕹️ **Cómo funciona**
Al apuntar el teléfono al marcador aparece un camino sobre el papel y el Tiliche empieza a correr. Cada pocos segundos llega una puerta con tres letreros: dos son ciertos y uno es *el intruso*. Por ejemplo: "¿Qué comparsa NO es del carnaval putleco? Copalas, Mascaritas, Parachicos". Cambias de carril con botones en pantalla para atrapar al intruso. Hay 12 puertas, 3 vidas, combos, tlayudas que dan puntos y magueyes que te hacen tropezar. Al final obtienes un rango, de "Turista" a "Oaxaqueño de corazón".

🛠️ **Herramientas**
MindAR para el rastreo de imagen en el navegador, three.js para el 3D, Meshy para generar los modelos (Tiliche, maguey y tlayuda), Web Audio API para la música y los efectos (todo sintetizado en código) y Python con OpenCV para diseñar y analizar el marcador.

🧩 **Retos**
1. **El marcador.** Un QR solo es muy repetitivo y el rastreador se pierde. Le agregué un marco con muesca asimétrica, grecas de Mitla y tipografía grande, y lo medí con OpenCV hasta llegar a unos 8,900 puntos de rastreo con baja simetría.
2. **Las preguntas.** Quería que fueran difíciles de verdad, para oaxaqueños: días de plaza, magueyes silvestres, la Tumba 7 de Monte Albán, el chichilo… Verifiqué cada dato antes de meterlo.
3. **Legibilidad en RA.** Los letreros en 3D se ven pequeños en el teléfono, así que las opciones también aparecen como botones grandes alineados con los carriles.
4. **Pausa inteligente.** Si se pierde el marcador, el juego se detiene en lugar de castigar al jugador.

✅ **Resultado**
Una experiencia web que se abre desde el navegador, sin instalar nada, con sonido, vibración y confeti en cada acierto. Fue la mejor excusa para aprender RA y, de paso, presumir un poco de Oaxaca.

🎥 [video / GIF aquí]
💻 Repositorio: https://github.com/TU-USUARIO/01-tiliche-ra-qr
🔗 Pruébalo: https://TU-URL

#RealidadAumentada #WebAR #MindAR #threejs #Oaxaca #DesarrolloWeb #Gamificación
