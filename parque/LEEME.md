# Parque de Atracciones 3D

## Estructura

- `javascript/aplicacion/`: inicio y coordinacion de la aplicacion.
- `javascript/camara/`: camara orbital y vistas predefinidas.
- `javascript/entorno/`: perfiles de iluminacion y atmosfera.
- `javascript/geometria/`: generacion de geometria reutilizable.
- `javascript/matematicas/`: operaciones de matrices.
- `javascript/renderizado/`: motor WebGL, mallas y nodos de escena.
- `javascript/escena/`: composicion del parque y sus atracciones.
- `javascript/main.js`: punto de entrada que inicia la aplicacion.
- `estilos/`: estilos de la interfaz.
- `texturas/`: imagenes usadas en los objetos 3D; `texturas/luna.jpg` es el mapa de crateres aplicado a la luna.

Los modulos usan clases ES y `import`/`export` para mantener sus dependencias explicitas y evitar un espacio global compartido.

El panel permite ajustar la hora con una barra o reproducir el ciclo diario. El sol y la luna recorren el cielo y aportan la iluminacion direccional de la escena. El cielo envolvente cambia suavemente, las farolas se encienden al anochecer y se apagan al amanecer. El terreno extendido y los cerros rodean el parque para completar el horizonte al orbitar la camara. Un dia del parque dura cuatro minutos.

La escena genera sombras direccionales que siguen al astro con mayor iluminacion, por lo que cambian de direccion entre el dia y la noche.

## Ejecucion

Como el navegador restringe los modulos ES al abrir un archivo directamente, inicia el proyecto desde un servidor local. Por ejemplo, desde esta carpeta:

```powershell
python -m http.server 8000
```

Luego abre `http://localhost:8000/inicio.html` en el navegador.
