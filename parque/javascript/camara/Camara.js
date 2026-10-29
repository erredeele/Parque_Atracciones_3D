'use strict';

import Matriz4 from '../matematicas/Matriz4.js';

export default class Camara {
  constructor(engine) {
    this.canvas = engine.canvas;
    this.standardFov = Math.PI / 3.2;
    this.generalFov = Math.PI / 2;
    this.current = { yaw: 0, pit: .5, d: 56, x: 0, y: 2, z: 0, fov: this.generalFov };
    this.target = { yaw: 0, pit: .5, d: 56, x: 0, y: 2, z: 0, fov: this.generalFov };
    this.views = {
      1: { yaw: .5, pit: .25, d: 30, x: -16, y: 7, z: -8 },
      2: { yaw: -.5, pit: .3, d: 24, x: 16, y: 3, z: -8 },
      3: { yaw: -.3, pit: .2, d: 26, x: 18, y: 4, z: 12 },
      4: { yaw: 0, pit: .5, d: 56, x: 0, y: 2, z: 0 },
      5: { yaw: 0, pit: .3, d: 22, x: 0, y: 6, z: -13 },
      6: { yaw: 0, pit: .3, d: 22, x: -17, y: 2, z: 12 }
    };
  }

  go(key) {
    Object.assign(this.target, this.views[key]);
    this.target.fov = key === '4' ? this.generalFov : this.standardFov;
  }

  update() {
    for (const key in this.current) {
      this.current[key] += (this.target[key] - this.current[key]) * .08;
    }
  }

  matrices() {
    const c = this.current;
    const eye = [
      c.x + c.d * Math.cos(c.pit) * Math.sin(c.yaw),
      c.y + c.d * Math.sin(c.pit),
      c.z + c.d * Math.cos(c.pit) * Math.cos(c.yaw)
    ];
    return {
      eye,
      vp: Matriz4.multiply(
        Matriz4.perspective(c.fov, this.canvas.width / this.canvas.height, .5, 1500),
        Matriz4.lookAt(eye, [c.x, c.y, c.z], [0, 1, 0])
      )
    };
  }
}
