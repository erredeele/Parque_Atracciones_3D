'use strict';

import Aplicacion from './aplicacion/Aplicacion.js';

const aplicacion = new Aplicacion();

try {
  await aplicacion.iniciar();
} catch (error) {
  console.error('No se pudo iniciar el parque de atracciones.', error);
  document.getElementById('v').textContent = 'ERROR AL CARGAR';
  throw error;
}
