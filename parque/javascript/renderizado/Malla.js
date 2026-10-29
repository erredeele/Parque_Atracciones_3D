'use strict';

export default class Malla {
  constructor(engine, geometry) {
    this.gl = engine.gl;
    this.buffers = [
      this.createBuffer(geometry.p, 0, 3),
      this.createBuffer(geometry.n, 1, 3),
      this.createBuffer(geometry.t, 2, 2)
    ];
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.i), this.gl.STATIC_DRAW);
    this.indexCount = geometry.i.length;
  }

  createBuffer(data, location, size) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
    return { buffer, location, size };
  }

  draw() {
    this.buffers.forEach(({ buffer, location, size }) => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.enableVertexAttribArray(location);
      this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
    });
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
  }
}
