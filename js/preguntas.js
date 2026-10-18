// Banco de preguntas "Atrapa al intruso": en cada puerta 2 opciones son correctas
// y 1 es el intruso. `intruso` es el índice dentro de `opciones` (se barajan al jugar).
export const PREGUNTAS = [
  {
    pista: '¿Cuál NO es una de las 8 regiones de Oaxaca?',
    opciones: ['Cañada', 'Papaloapan', 'Huasteca'], intruso: 2,
    dato: 'Las 8 regiones: Valles Centrales, Sierra Norte, Sierra Sur, Costa, Istmo, Mixteca, Cañada y Papaloapan.',
  },
  {
    pista: '¿Cuál NO es de los 7 moles oaxaqueños?',
    opciones: ['Chichilo', 'Manchamanteles', 'Mole de olla'], intruso: 2,
    dato: 'Los 7: negro, rojo, coloradito, amarillo, verde, chichilo y manchamanteles.',
  },
  {
    pista: 'Atrapa al mole que SÍ lleva chocolate',
    opciones: ['Amarillo', 'Verde', 'Negro'], intruso: 2,
    dato: 'El amarillo y el verde no llevan chocolate; el negro sí, junto con chilhuacle negro.',
  },
  {
    pista: 'Pueblo y artesanía: ¿qué pareja es el intruso?',
    opciones: ['San Bartolo Coyotepec — barro negro', 'Teotitlán del Valle — tapetes de lana', 'Santa María Atzompa — alebrijes'], intruso: 2,
    dato: 'Atzompa es famosa por su barro verde vidriado. Los alebrijes de copal se tallan en Tilcajete y Arrazola.',
  },
  {
    pista: '¿Dónde NO se tallan alebrijes de copal?',
    opciones: ['San Martín Tilcajete', 'San Antonio Arrazola', 'Santo Tomás Jalieza'], intruso: 2,
    dato: 'Santo Tomás Jalieza es famoso por sus textiles en telar de cintura.',
  },
  {
    pista: 'Atrapa al maguey cultivado (los otros son silvestres)',
    opciones: ['Tobalá', 'Tepeztate', 'Espadín'], intruso: 2,
    dato: 'El espadín es el agave más cultivado para mezcal; tobalá y tepeztate crecen silvestres.',
  },
  {
    pista: '¿Qué NO lleva el tejate?',
    opciones: ['Pixtle (hueso de mamey)', 'Rosita de cacao', 'Café'], intruso: 2,
    dato: 'El tejate lleva maíz, cacao, pixtle y rosita de cacao. San Andrés Huayápam es su cuna.',
  },
  {
    pista: '¿Qué NO tiene que ver con la Guelaguetza?',
    opciones: ['Lunes del Cerro', 'Cerro del Fortín', 'Se celebra en noviembre'], intruso: 2,
    dato: 'La Guelaguetza se celebra en julio, en los Lunes del Cerro, en el Cerro del Fortín.',
  },
  {
    pista: 'Noche de Rábanos: atrapa al intruso',
    opciones: ['Es el 23 de diciembre', 'Hay categorías de flor inmortal y totomoxtle', 'Es un concurso de pan de yema'], intruso: 2,
    dato: 'Se celebra desde 1897 en el Zócalo; compiten figuras de rábano, flor inmortal y totomoxtle.',
  },
  {
    pista: '¿Quién NO es personaje de la Danza de la Pluma?',
    opciones: ['Moctezuma', 'La Malinche', 'Juan Diego'], intruso: 2,
    dato: 'La Danza de la Pluma representa la Conquista: Moctezuma, Malinche, Cortés y soldados.',
  },
  {
    pista: 'Baile y región: ¿qué pareja es el intruso?',
    opciones: ['Flor de Piña — Papaloapan', 'Danza de la Pluma — Valles Centrales', 'Chilenas — Sierra Norte'], intruso: 2,
    dato: 'Las chilenas son de la Costa: Pinotepa, Jamiltepec y alrededores.',
  },
  {
    pista: 'Sobre el nombre "Oaxaca", ¿qué es falso?',
    opciones: ['Viene del náhuatl Huaxyacac', 'Se relaciona con el árbol de guaje', 'Viene del zapoteco "tierra del sol"'], intruso: 2,
    dato: 'Huaxyacac significa "en la punta de los guajes", en náhuatl.',
  },
  {
    pista: '¿Qué zona arqueológica NO está en Oaxaca?',
    opciones: ['Lambityeco', 'Dainzú', 'Cantona'], intruso: 2,
    dato: 'Cantona está en Puebla. Lambityeco y Dainzú están en los Valles Centrales.',
  },
  {
    pista: 'Tumba 7 de Monte Albán: atrapa al intruso',
    opciones: ['La exploró Alfonso Caso', 'Se halló en 1932', 'Su tesoro es olmeca'], intruso: 2,
    dato: 'El tesoro de la Tumba 7 es mixteco: oro, plata, jade y hueso tallado.',
  },
  {
    pista: 'Benito Juárez: ¿qué es falso?',
    opciones: ['Nació en San Pablo Guelatao', 'Era zapoteco', 'Nació en 1810'], intruso: 2,
    dato: 'Juárez nació el 21 de marzo de 1806 en Guelatao, en la Sierra Norte.',
  },
  {
    pista: 'Barro negro: atrapa al intruso',
    opciones: ['Doña Rosa le dio el brillo en los años 50', 'Se bruñe con piedra de cuarzo', 'Se pinta con grafito para que brille'], intruso: 2,
    dato: 'El brillo sale de bruñir la pieza con cuarzo antes de cocerla, no de pintura.',
  },
  {
    pista: 'Quesillo: ¿qué es falso?',
    opciones: ['Se le atribuye a Reyes Etla', 'Se estira en tiras y se enrolla en bola', 'Se madura 6 meses en cava'], intruso: 2,
    dato: 'El quesillo es un queso fresco de pasta hilada; no se madura.',
  },
  {
    pista: '¿Qué NO lleva una tlayuda tradicional?',
    opciones: ['Asiento', 'Quesillo', 'Queso Cotija'], intruso: 2,
    dato: 'Asiento, frijol, quesillo y tasajo, cecina o chorizo. El Cotija es de Michoacán.',
  },
  {
    pista: 'En el palenque, ¿qué NO se usa para hacer mezcal?',
    opciones: ['Tahona', 'Horno cónico de tierra', 'Nixtamal'], intruso: 2,
    dato: 'Las piñas se cuecen en horno de tierra y se muelen con tahona. El nixtamal es para el maíz.',
  },
  {
    pista: '¿Qué NO está en el ex convento de Santo Domingo?',
    opciones: ['Jardín Etnobotánico', 'Museo de las Culturas de Oaxaca', 'Museo Frida Kahlo'], intruso: 2,
    dato: 'El Museo Frida Kahlo está en Coyoacán, CDMX.',
  },
  {
    pista: 'Árbol del Tule: atrapa al intruso',
    opciones: ['Es un ahuehuete', 'Está en Santa María del Tule', 'Es una ceiba'], intruso: 2,
    dato: 'Es un ahuehuete (Taxodium mucronatum), de los troncos más anchos del mundo.',
  },
  {
    pista: 'Hierve el Agua: ¿qué es falso?',
    opciones: ['Tiene cascadas petrificadas', 'Está en San Lorenzo Albarradas', 'Está en la Costa'], intruso: 2,
    dato: 'Está en los Valles Centrales, cerca de Mitla.',
  },
  {
    pista: 'Pan de muerto oaxaqueño: atrapa al intruso',
    opciones: ['Es pan de yema', 'Lleva una carita de pasta', 'Va cubierto de azúcar con "huesitos"'], intruso: 2,
    dato: 'El de huesitos con azúcar es el estilo del centro del país; el oaxaqueño lleva carita.',
  },
  {
    pista: 'Día de Muertos: ¿qué NO es oaxaqueño?',
    opciones: ['Muerteada de San Agustín Etla', 'Tapetes de arena', 'Alumbrada de Mixquic'], intruso: 2,
    dato: 'San Andrés Mixquic está en Tláhuac, CDMX.',
  },
  {
    pista: 'Textiles: ¿qué pareja NO es oaxaqueña?',
    opciones: ['San Antonino — blusas "hazme si puedes"', 'Teotitlán — tapetes teñidos con grana', 'Tenancingo — rebozos de bolita'], intruso: 2,
    dato: 'Tenancingo está en el Estado de México.',
  },
  {
    pista: 'Tinte natural y color: ¿qué pareja es el intruso?',
    opciones: ['Grana cochinilla — rojo', 'Añil — azul', 'Caracol púrpura — amarillo'], intruso: 2,
    dato: 'El caracol púrpura (tixinda) da morado; lo usan en Pinotepa de Don Luis.',
  },
  {
    pista: '¿Qué pueblo NO es originario de Oaxaca?',
    opciones: ['Chatino', 'Chocholteco', 'Rarámuri'], intruso: 2,
    dato: 'Los rarámuri son de Chihuahua. Oaxaca reconoce 16 pueblos indígenas y al pueblo afromexicano.',
  },
  {
    pista: '¿Qué NO es tradición del Istmo?',
    opciones: ['Las velas', 'El traje de tehuana', 'La comparsa de Tiliches'], intruso: 2,
    dato: 'Los Tiliches son del carnaval de Putla Villa de Guerrero.',
  },
  {
    pista: 'Los Tiliches: atrapa al intruso',
    opciones: ['Traje de retazos de tela', 'Representan a los peones del campo', 'Penacho de plumas de quetzal'], intruso: 2,
    dato: 'Visten retazos de tela que vuelan al bailar, sombrero y máscara de viejito.',
  },
  {
    pista: '¿Qué comparsa NO es del carnaval putleco?',
    opciones: ['Copalas', 'Mascaritas', 'Parachicos'], intruso: 2,
    dato: 'Los parachicos son de Chiapa de Corzo, Chiapas.',
  },
  {
    pista: 'Chile y región: ¿qué pareja es el intruso?',
    opciones: ['Chile de agua — Valles Centrales', 'Chilhuacle — Cañada', 'Pasilla mixe — Costa'], intruso: 2,
    dato: 'El pasilla mixe se ahuma en la Sierra Norte, tierra mixe.',
  },
  {
    pista: 'Día de plaza: ¿qué pareja es el intruso?',
    opciones: ['Tlacolula — domingo', 'Zaachila — jueves', 'Ocotlán — lunes'], intruso: 2,
    dato: 'Ocotlán es el viernes. Etla es el miércoles.',
  },
  {
    pista: 'Ciudad de Oaxaca: ¿qué es falso?',
    opciones: ['Se construyó con cantera verde', 'Se fundó como Antequera', 'Es Patrimonio de la Humanidad desde 2010'], intruso: 2,
    dato: 'El Centro Histórico y Monte Albán son Patrimonio de la Humanidad desde 1987.',
  },
  {
    pista: 'Mitla: atrapa al intruso',
    opciones: ['Grecas de piedra sin mezcla', 'Lyobaa, su nombre zapoteco', 'Pirámide del Sol'], intruso: 2,
    dato: 'La Pirámide del Sol está en Teotihuacan. Mitla es famosa por sus grecas.',
  },
  {
    pista: 'Pelota mixteca: ¿qué es falso?',
    opciones: ['Se golpea con un guante pesado', 'Hay modalidad de hule y de forro', 'Se juega con raqueta de madera'], intruso: 2,
    dato: 'Se juega con un guante de cuero muy pesado, sin raqueta.',
  },
  {
    pista: 'Platillo y región: ¿qué pareja es el intruso?',
    opciones: ['Garnachas — Istmo', 'Tasajo — Valles Centrales', 'Cochinita pibil — Costa'], intruso: 2,
    dato: 'La cochinita pibil es de Yucatán.',
  },
  {
    pista: 'La palabra Guelaguetza: ¿qué es falso?',
    opciones: ['Es de origen zapoteco', 'Significa ofrenda o cooperación', 'Significa "fiesta del maíz" en mixteco'], intruso: 2,
    dato: 'Guelaguetza es zapoteco: el intercambio recíproco de ayuda entre la comunidad.',
  },
  {
    pista: 'Leyenda de Donají: atrapa al intruso',
    opciones: ['Era princesa zapoteca', 'Su cabeza apareció junto a una azucena', 'Murió en Tenochtitlan'], intruso: 2,
    dato: 'Su cabeza apareció junto al río Atoyac; está en el escudo de la ciudad.',
  },
  {
    pista: '¿Qué artista NO es oaxaqueño?',
    opciones: ['Rodolfo Morales', 'Francisco Toledo', 'José Clemente Orozco'], intruso: 2,
    dato: 'Orozco era de Jalisco. Morales era de Ocotlán y Toledo de Juchitán.',
  },
  {
    pista: 'Canción y autor: ¿qué pareja es el intruso?',
    opciones: ['"Dios nunca muere" — Macedonio Alcalá', '"Canción Mixteca" — José López Alavez', '"La Sandunga" — Agustín Lara'], intruso: 2,
    dato: 'La Sandunga es un son tradicional del Istmo de Tehuantepec.',
  },
  {
    pista: 'En una calenda, ¿qué NO aparece?',
    opciones: ['Marmotas de manta', 'Monos de calenda', 'Chinelos'], intruso: 2,
    dato: 'Los chinelos son de Morelos. Las calendas llevan marmotas, monos y banda.',
  },
];
