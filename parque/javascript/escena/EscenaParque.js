'use strict';

import Geometria from '../geometria/Geometria.js';

export default class EscenaParque {
  constructor(engine) {
    this.engine = engine;
  }

  randomTextureMarks(ctx, count, drawMark) {
    for (let i = 0; i < count; i++) {
      drawMark(ctx, Math.random() * 256, Math.random() * 256);
    }
  }

  node(mesh, options, ...children) {
    return this.engine.createNode(mesh, options, ...children);
  }

  async build() {
    const G = {
      cube: this.engine.createMesh(Geometria.cube()),
      cyl: this.engine.createMesh(Geometria.cylinder(32, 1)),
      cone: this.engine.createMesh(Geometria.cylinder(32, 0)),
      pyr: this.engine.createMesh(Geometria.cylinder(4, 0)),
      sph: this.engine.createMesh(Geometria.sphere()),
      celestialSphere: this.engine.createMesh(Geometria.sphere(48, 64)),
      sky: this.engine.createMesh(Geometria.sphere(32, 48)),
      tor: this.engine.createMesh(Geometria.torus(.04)),
      rail: this.engine.createMesh(Geometria.torus(.03))
    };
    const T = {
      grass: this.engine.createTexture(x => {
        x.fillStyle = '#4c9a3c';
        x.fillRect(0, 0, 256, 256);
        this.randomTextureMarks(x, 2500, (x, a, b) => {
          x.fillStyle = Math.random() < .5 ? '#3d8530' : '#68b04c';
          x.fillRect(a, b, 3, 3);
        });
      }),
      stone: this.engine.createTexture(x => {
        x.fillStyle = '#b8b2a8';
        x.fillRect(0, 0, 256, 256);
        x.strokeStyle = '#6f6a62';
        x.lineWidth = 3;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 4; c++) {
            x.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32);
          }
        }
      }),
      wood: this.engine.createTexture(x => {
        x.fillStyle = '#9b6a3a';
        x.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 16) {
          x.fillStyle = y % 32 ? '#8a5a2e' : '#a87646';
          x.fillRect(0, y, 256, 14);
        }
      }),
      stripes: this.engine.createTexture(x => {
        for (let i = 0; i < 8; i++) {
          x.fillStyle = i % 2 ? '#fff' : '#d62828';
          x.fillRect(i * 32, 0, 32, 256);
        }
      }),
      sun: this.engine.createTexture(x => {
        const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
        g.addColorStop(0, '#fff3b0');
        g.addColorStop(.6, '#ffb020');
        g.addColorStop(1, '#ff7a18');
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
      })
    };
    const RED = [.85, .15, .15];
    const WHITE = [.95, .95, .95];
    const GOLD = [.95, .75, .2];
    const BLUE = [.2, .35, .75];
    const GREEN = [.2, .6, .25];
    const PI = Math.PI, root = this.node(null, {}), lamps = [];

    // Cielo envolvente, terreno extendido y cerros al horizonte
    root.add(
      this.node(G.sky, { em: 1, tex: this.engine.skyTexture, s: [1200, 1200, 1200], castShadow: false }),
      this.node(G.cube, {
        c: [.85, 1, .85],
        tex: T.grass,
        p: [0, -.15, 0],
        s: [2000, .2, 2000],
        uv: [400, 400],
        castShadow: false
      })
    );
    for (let i = 0; i < 16; i++) {
      const angle = i * 2 * PI / 16;
      const radius = i % 2 ? 390 : 360;
      const width = i % 2 ? 165 : 145;
      const height = i % 3 ? 15 : 20;
      root.add(this.node(G.sph, {
        c: i % 2 ? [.16, .37, .22] : [.19, .41, .25],
        p: [Math.cos(angle) * radius, height * .4 - .05, Math.sin(angle) * radius],
        s: [width, height * 1.25, width * .78],
        fog: false,
        castShadow: false
      }));
    }

    // Terreno y caminos del parque
    root.add(
      this.node(G.cube, { c: [.85, 1, .85], tex: T.grass, p: [0, -.1, 0], s: [70, .2, 54], uv: [14, 11] }),
      this.node(G.cube, { tex: T.stone, p: [0, .03, 0], s: [60, .05, 4], uv: [15, 1] }),
      this.node(G.cube, { tex: T.stone, p: [0, .03, 14], s: [4, .05, 28], uv: [1, 7] })
    );

    // NORIA: rueda (hub) gira en Z; cada cabina contrarresta el giro para quedar vertical
    const R = 6.5, noria = this.node(null, { p: [-16, 0, -8] });
    const hub = this.node(null, { p: [0, 8, 0], u: (h, t) => h.r[2] = t * .25 });
    [.6, -.6].forEach(z => {
      hub.add(this.node(G.tor, { c: RED, p: [0, 0, z], s: [R, R, R] }));
      for (let k = 0; k < 6; k++) {
        hub.add(this.node(G.cube, {
          c: WHITE, p: [0, 0, z], r: [0, 0, k * PI / 6], s: [.12, 2 * R, .12]
        }));
      }
    });
    hub.add(this.node(G.cyl, { c: [.5, .5, .55], r: [PI / 2, 0, 0], s: [.5, 3.6, .5], sh: 60 }));
    for (let i = 0; i < 12; i++) {
      const a = i * 2 * PI / 12;
      hub.add(this.node(null, {
        p: [R * Math.cos(a), R * Math.sin(a), 0],
        u: c => c.r[2] = -hub.r[2]
      },
        this.node(G.cube, { c: [.4, .4, .4], p: [0, -.45, 0], s: [.08, .9, .08] }),
        this.node(G.cube, { c: i % 2 ? RED : [.95, .8, .2], p: [0, -1.1, 0], s: [1.3, .9, 1.1] })
      ));
    }
    noria.add(hub);
    [[-1.8, -.4636], [1.8, .4636]].forEach(([z, _]) => [-1, 1].forEach(sd =>
      noria.add(this.node(G.cube, {
        c: [.8, .8, .85],
        p: [sd * 2, 4, z],
        r: [0, 0, -sd * .4636],
        s: [.4, 8.94, .4]
      }))
    ));
    root.add(noria);

    // CARRUSEL: plataforma gira en Y; caballitos son hijos y suben/bajan
    const car = this.node(G.cyl, { c: GOLD, p: [16, .2, -8], s: [8, .4, 8], sh: 40 });
    const plat = this.node(G.cyl, { c: [.9, .2, .2], p: [0, .4, 0], s: [7.6, .3, 7.6], u: (p, t) => p.r[1] = t * .5 });
    plat.add(
      this.node(G.cyl, { c: GOLD, p: [0, 2.7, 0], s: [.6, 5, .6], sh: 60 }),
      this.node(G.cone, { tex: T.stripes, p: [0, 5.8, 0], s: [8.6, 1.8, 8.6] }),
      this.node(G.sph, { c: GOLD, p: [0, 6.9, 0], s: [.4, .4, .4] })
    );
    for (let i = 0; i < 8; i++) {
      const a = i * 2 * PI / 8;
      plat.add(this.node(null, {
        p: [3 * Math.cos(a), 1.6, 3 * Math.sin(a)],
        r: [0, -a - PI / 2, 0],
        u: (h, t) => h.p[1] = 1.6 + .5 * Math.sin(t * 2 + i)
      },
        this.node(G.cyl, { c: GOLD, p: [0, 1.2, 0], s: [.08, 3, .08] }),
        this.node(G.cube, { c: i % 2 ? [.95, .95, .95] : [.45, .25, .12], s: [1.3, .7, .5] }),
        this.node(G.cube, { c: i % 2 ? [.95, .95, .95] : [.45, .25, .12], p: [.65, .5, 0], r: [0, 0, -.5], s: [.35, .7, .35] })
      ));
    }
    car.add(plat);
    root.add(car);

    // BARCO VIKINGO: pendulo en X, el casco cuelga del eje
    const ship = this.node(null, { p: [18, 0, 12] });
    const piv = this.node(null, { p: [0, 7, 0], u: (p, t) => p.r[0] = .9 * Math.sin(t * .9) });
    piv.add(
      this.node(G.cube, { c: [.3, .3, .35], p: [0, -3, 0], s: [.25, 6, .25] }),
      this.node(G.cube, { c: BLUE, tex: T.wood, p: [0, -6, 0], s: [1.8, .8, 7] }),
      this.node(G.cube, { c: BLUE, tex: T.wood, p: [0, -5.6, 3.9], r: [-.6, 0, 0], s: [1.6, .7, 1.6] }),
      this.node(G.cube, { c: BLUE, tex: T.wood, p: [0, -5.6, -3.9], r: [.6, 0, 0], s: [1.6, .7, 1.6] })
    );
    ship.add(piv, this.node(G.cyl, { c: [.7, .7, .75], p: [0, 7, 0], r: [0, 0, PI / 2], s: [.3, 7, .3] }));
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => ship.add(this.node(G.cube, {
      c: [.75, .75, .8],
      p: [sx * 3, 3.5, sz * 1.75],
      r: [sz * -.4636, 0, 0],
      s: [.35, 7.83, .35]
    }))));
    root.add(ship);

    // TORRE DE CAIDA: movimiento vertical por tramos (sube, pausa, cae)
    const tw = this.node(null, { p: [0, 0, -13] });
    tw.add(
      this.node(G.cyl, { c: [.6, .6, .65], p: [0, 6, 0], s: [1, 12, 1] }),
      this.node(G.cyl, { c: RED, p: [0, 12.3, 0], s: [1.6, .6, 1.6] }),
      this.node(null, {
        u: (s, t) => {
          const q = t % 14;
          s.p[1] = q < 8 ? 1 + 10 * q / 8 : q < 10 ? 11 : q < 12 ? 11 - 10 * ((q - 10) / 2) ** 2 : 1;
        }
      },
        this.node(G.cube, { c: [.95, .85, .1], s: [2.6, .4, 2.6] }),
        this.node(G.cube, { c: [.95, .85, .1], p: [0, -.6, 0], s: [.5, .8, .5] })
      )
    );
    root.add(tw);

    // TRENCITO: pivote en el centro que rota; cada vagon con desfase angular
    const tr = this.node(null, { p: [-17, 0, 12] });
    tr.add(this.node(G.rail, { c: [.35, .35, .4], p: [0, .1, 0], r: [PI / 2, 0, 0], s: [7, 7, 7] }));
    for (let i = 0; i < 4; i++) {
      tr.add(this.node(null, { u: (c, t) => c.r[1] = t * .4 - i * .34 },
        this.node(null, { p: [7, .8, 0] },
          i === 0
            ? this.node(G.cube, { c: GREEN, s: [1.2, 1.1, 2.2] })
            : this.node(G.cube, { c: RED, s: [1.1, .8, 1.8] }),
          ...(i === 0 ? [this.node(G.cyl, { c: [.2, .2, .2], p: [0, .9, .7], s: [.3, .8, .3] })] : []),
          this.node(G.cyl, { c: [.1, .1, .1], p: [0, -.4, .6], r: [0, 0, PI / 2], s: [.45, 1.4, .45] }),
          this.node(G.cyl, { c: [.1, .1, .1], p: [0, -.4, -.6], r: [0, 0, PI / 2], s: [.45, 1.4, .45] })
        )
      ));
    }
    root.add(tr);

    // Plaza con fuente
    root.add(
      this.node(G.cyl, { tex: T.stone, p: [0, .2, 0], s: [4, .4, 4] }),
      this.node(G.cyl, { c: [.3, .6, .9], p: [0, .7, 0], s: [2.6, .5, 2.6], sh: 80 }),
      this.node(G.cyl, { c: [.7, .7, .7], p: [0, 1.5, 0], s: [.4, 2, .4] }),
      this.node(G.sph, { c: [.5, .8, 1], p: [0, 2.7, 0], s: [.7, .7, .7], sh: 80 })
    );

    // Puestos de comida
    [[-7, 4], [7, 4], [-7, -14], [7, -14]].forEach(([x, z], i) => root.add(
      this.node(null, { p: [x, 0, z], r: [0, i % 2 ? -.3 : .3, 0] },
        this.node(G.cube, { c: [.9, .8, .6], tex: T.wood, p: [0, 1.1, 0], s: [3, 2.2, 2.2] }),
        this.node(G.cube, { c: [.5, .3, .15], p: [0, 1.2, 1.4], s: [3.2, .2, .8] }),
        this.node(G.pyr, { tex: T.stripes, p: [0, 2.9, 0], r: [0, PI / 4, 0], s: [2.4, 1.4, 2.4] })
      )
    ));

    // Arboles
    [
      [-28, -20], [-10, -22], [6, -22], [28, -20], [-30, 0], [30, 2], [-28, 22],
      [30, 22], [-12, 22], [12, 22], [24, -2], [-24, 3], [-4, -20], [34 - 4, -12]
    ].forEach(([x, z], i) =>
      root.add(this.node(G.cyl, { c: [.4, .25, .12], p: [x, 1, z], s: [.4, 2, .4] }),
        i % 2
          ? this.node(G.sph, { c: [.15, .5, .2], p: [x, 3.2, z], s: [1.8, 1.8, 1.8] })
          : this.node(G.cone, { c: [.1, .45, .2], p: [x, 3.6, z], s: [2.2, 3.2, 2.2] })
      )
    );

    // Farolas (cada una aporta una luz puntual) 
    const lampBulbs = [];
    [
      [-10, 2.8], [-5, 2.8], [5, 2.8], [10, 2.8], [2.8, 10], [-2.8, 20]
    ].forEach(([x, z]) => {
      lamps.push(x, 4.2, z);
      const bulb = this.node(G.sph, { c: [1, .9, .55], em: 1, p: [x, 4.2, z], s: [.38, .38, .38] });
      lampBulbs.push(bulb);
      root.add(
        this.node(G.cyl, { c: [.2, .2, .25], p: [x, 2, z], s: [.12, 4, .12] }),
        bulb
      );
    });

    // Cerca y entrada
    [[0, .8], [0, 1.4]].forEach(([_, y]) => {
      root.add(
        this.node(G.cube, { c: [.55, .35, .2], p: [0, y, -26], s: [66, .15, .15] }),
        this.node(G.cube, { c: [.55, .35, .2], p: [-18.5, y, 26], s: [29, .15, .15] }),
        this.node(G.cube, { c: [.55, .35, .2], p: [18.5, y, 26], s: [29, .15, .15] }),
        this.node(G.cube, { c: [.55, .35, .2], p: [-33, y, 0], s: [.15, .15, 52] }),
        this.node(G.cube, { c: [.55, .35, .2], p: [33, y, 0], s: [.15, .15, 52] })
      );
    });
    for (let x = -33; x <= 33; x += 3) {
      root.add(this.node(G.cyl, { c: [.5, .3, .18], p: [x, .9, -26], s: [.25, 1.8, .25] }));
      if (Math.abs(x) > 4) root.add(this.node(G.cyl, { c: [.5, .3, .18], p: [x, .9, 26], s: [.25, 1.8, .25] }));
    }
    for (let z = -23; z <= 23; z += 3) {
      [-33, 33].forEach(x => root.add(this.node(G.cyl, {
        c: [.5, .3, .18],
        p: [x, .9, z],
        s: [.25, 1.8, .25]
      })));
    }
    root.add(
      this.node(G.cube, { c: RED, p: [-4, 3, 26], s: [.9, 6, .9] }),
      this.node(G.cube, { c: RED, p: [4, 3, 26], s: [.9, 6, .9] }),
      this.node(G.cube, { c: GOLD, p: [0, 6.3, 26], s: [9.8, 1.2, .9] })
    );

    // Globos flotantes con cuerda
    [[-4, 9, 12, RED], [4, 11, 10, [.2, .5, .9]], [-7, 13, 16, GOLD], [7, 10, 16, [.7, .2, .8]], [0, 12, 14, GREEN]]
      .forEach(([x, y, z, c], i) =>
        root.add(this.node(null, {
          p: [x, y, z],
          u: (b, t) => {
            b.p[1] = y + .6 * Math.sin(t * 1.2 + i);
            b.r[2] = .12 * Math.sin(t * .9 + i);
          }
        },
          this.node(G.sph, { c, s: [.9, 1.1, .9], sh: 60 }),
          this.node(G.cyl, { c: [.9, .9, .9], p: [0, -2.1, 0], s: [.03, 3, .03] })
        ))
      );

    // Sol: esfera emisiva texturizada; define la direccion de la luz principal
    const moon = await this.engine.createImageTexture(new URL('../../texturas/luna.jpg', import.meta.url));
    this.sunNode = this.node(G.celestialSphere, { em: 1, tex: T.sun, s: [36, 36, 36], castShadow: false });
    this.moonNode = this.node(G.celestialSphere, { em: 1, tex: moon, s: [0, 0, 0], castShadow: false });
    root.add(this.sunNode, this.moonNode);
    this.root = root;
    this.lamps = lamps;
    this.lampBulbs = lampBulbs;
    this.sunDir = [0, 0, 1];
    this.moonDir = [0, 0, 1];
    this.sunIntensity = 0;
    this.moonIntensity = 0;
    this.setHora(17);
    return this;
  }

  setHora(hour) {
    const angle = (hour - 6) * Math.PI / 12;
    const sunLightPosition = [Math.cos(angle) * 80, Math.sin(angle) * 95, -120];
    const sunPosition = [sunLightPosition[0], sunLightPosition[1], -500];
    const moonAngle = angle - (2 * Math.PI) / 3;
    const moonLightPosition = [
      Math.cos(moonAngle) * 170,
      Math.sin(moonAngle) * 95,
      -120
    ];
    const moonPosition = [moonLightPosition[0], moonLightPosition[1], -500];
    const daylight = this.smoothStep(-12, 24, sunPosition[1]);
    const lampIntensity = 1 - daylight;
    const sunVisibility = this.smoothStep(0, 10, sunPosition[1]);
    const moonVisibility = this.smoothStep(0, 10, moonPosition[1]);
    const sunLength = Math.hypot(...sunLightPosition);
    const moonLength = Math.hypot(...moonLightPosition);

    this.sunNode.p = sunPosition;
    this.sunNode.s = [36 * sunVisibility, 36 * sunVisibility, 36 * sunVisibility];
    this.moonNode.p = moonPosition;
    this.moonNode.s = [28 * moonVisibility, 28 * moonVisibility, 28 * moonVisibility];
    this.sunDir = sunLightPosition.map(value => -value / sunLength);
    this.moonDir = moonLightPosition.map(value => -value / moonLength);
    this.sunIntensity = sunVisibility;
    this.moonIntensity = moonVisibility * .5;
    this.lampBulbs.forEach(bulb => {
      bulb.c = [lampIntensity, lampIntensity * .9, lampIntensity * .55];
    });
  }

  smoothStep(minimum, maximum, value) {
    const amount = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
    return amount * amount * (3 - 2 * amount);
  }
}
