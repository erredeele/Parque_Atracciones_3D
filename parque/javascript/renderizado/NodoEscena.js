'use strict';

import Matriz4 from '../matematicas/Matriz4.js';

export default class NodoEscena {
  constructor(engine, mesh, options = {}) {
    Object.assign(this, {
      engine,
      mesh,
      c: [1, 1, 1],
      tex: null,
      p: [0, 0, 0],
      r: [0, 0, 0],
      s: [1, 1, 1],
      em: 0,
      sh: 16,
      uv: [1, 1],
      u: null,
      fog: true,
      castShadow: true,
      k: []
    }, options);
  }

  add(...nodes) {
    this.k.push(...nodes);
    return this;
  }

  worldMatrix(parentMatrix, time) {
    if (this.u) this.u(this, time);
    const local = Matriz4.multiply(
      Matriz4.translation(...this.p),
      Matriz4.multiply(
        Matriz4.rotateY(this.r[1]),
        Matriz4.multiply(Matriz4.rotateX(this.r[0]), Matriz4.rotateZ(this.r[2]))
      )
    );
    return Matriz4.multiply(parentMatrix, local);
  }

  draw(parentMatrix, time) {
    const { gl, uniforms } = this.engine;
    const world = this.worldMatrix(parentMatrix, time);
    if (this.mesh) {
      const model = Matriz4.multiply(world, Matriz4.scale(...this.s));
      gl.uniformMatrix4fv(uniforms.uM, false, model);
      gl.uniformMatrix3fv(uniforms.uN, false, Matriz4.normal(model));
      gl.uniform3fv(uniforms.uCol, this.c);
      gl.uniform1f(uniforms.uEm, this.em);
      gl.uniform1f(uniforms.uSh, this.sh);
      gl.uniform1f(uniforms.uFog, this.fog ? 1 : 0);
      gl.uniform2fv(uniforms.uUV, this.uv);
      gl.uniform1f(uniforms.uUse, this.tex ? 1 : 0);
      if (this.tex) gl.bindTexture(gl.TEXTURE_2D, this.tex);
      this.mesh.draw();
    }
    this.k.forEach(child => child.draw(world, time));
  }

  drawShadow(parentMatrix, time, modelUniform) {
    const world = this.worldMatrix(parentMatrix, time);
    if (this.mesh && this.castShadow) {
      const model = Matriz4.multiply(world, Matriz4.scale(...this.s));
      this.engine.gl.uniformMatrix4fv(modelUniform, false, model);
      this.mesh.draw();
    }
    this.k.forEach(child => child.drawShadow(world, time, modelUniform));
  }
}
