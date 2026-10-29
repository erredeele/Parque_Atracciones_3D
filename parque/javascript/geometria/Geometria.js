'use strict';

export default class Geometria {
  static sphere(lat = 24, lon = 32) {
    const p = [], n = [], t = [], i = [];
    for (let a = 0; a <= lat; a++) {
      for (let b = 0; b <= lon; b++) {
        const th = a * Math.PI / lat, ph = b * 2 * Math.PI / lon;
        const x = Math.sin(th) * Math.cos(ph);
        const y = Math.cos(th);
        const z = Math.sin(th) * Math.sin(ph);
        p.push(x, y, z);
        n.push(x, y, z);
        t.push(b / lon, a / lat);
        if (a < lat && b < lon) {
          const q = a * (lon + 1) + b, w = q + lon + 1;
          i.push(q, w, q + 1, w, w + 1, q + 1);
        }
      }
    }
    return { p, n, t, i };
  }

  static cube() {
    const faces = [
      [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
      [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
      [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
      [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
      [[0, -1, 0], [1, 0, 0], [0, 0, 1]]
    ];
    const p = [], n = [], t = [], i = [];
    faces.forEach(([normal, uAxis, vAxis], face) => {
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
        for (let k = 0; k < 3; k++) {
          p.push(normal[k] * .5 + uAxis[k] * a * .5 + vAxis[k] * b * .5);
        }
        n.push(...normal);
        t.push((a + 1) / 2, (b + 1) / 2);
      });
      const offset = face * 4;
      i.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    });
    return { p, n, t, i };
  }

  // Eje Y, altura 1, radio inferior 1. Un radio superior 0 produce un cono.
  static cylinder(seg = 32, rTop = 1) {
    const p = [], n = [], t = [], i = [];
    const dr = 1 - rTop, nl = Math.hypot(1, dr);
    for (let j = 0; j <= seg; j++) {
      const a = j * 2 * Math.PI / seg;
      const c = Math.cos(a), s = Math.sin(a);
      p.push(c, -.5, s, c * rTop, .5, s * rTop);
      n.push(c / nl, dr / nl, s / nl, c / nl, dr / nl, s / nl);
      t.push(j / seg, 0, j / seg, 1);
      if (j < seg) {
        const q = j * 2;
        i.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
      }
    }
    [[-.5, 1, -1], [.5, rTop, 1]].forEach(([y, r, ny]) => {
      if (r === 0) return;
      const offset = p.length / 3;
      p.push(0, y, 0);
      n.push(0, ny, 0);
      t.push(.5, .5);
      for (let j = 0; j <= seg; j++) {
        const a = j * 2 * Math.PI / seg;
        p.push(Math.cos(a) * r, y, Math.sin(a) * r);
        n.push(0, ny, 0);
        t.push(.5 + Math.cos(a) / 2, .5 + Math.sin(a) / 2);
        if (j < seg) i.push(offset, offset + 1 + j, offset + 2 + j);
      }
    });
    return { p, n, t, i };
  }

  // Toro en el plano XY: radio mayor 1, radio del tubo r.
  static torus(r = .05, seg = 64, sides = 12) {
    const p = [], n = [], t = [], i = [];
    for (let a = 0; a <= seg; a++) {
      for (let b = 0; b <= sides; b++) {
        const u = a * 2 * Math.PI / seg, v = b * 2 * Math.PI / sides, cv = Math.cos(v);
        p.push((1 + r * cv) * Math.cos(u), (1 + r * cv) * Math.sin(u), r * Math.sin(v));
        n.push(cv * Math.cos(u), cv * Math.sin(u), Math.sin(v));
        t.push(a / seg * 8, b / sides);
        if (a < seg && b < sides) {
          const q = a * (sides + 1) + b, w = q + sides + 1;
          i.push(q, w, q + 1, w, w + 1, q + 1);
        }
      }
    }
    return { p, n, t, i };
  }
}
