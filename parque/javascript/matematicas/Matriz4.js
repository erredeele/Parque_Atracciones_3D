'use strict';

export default class Matriz4 {
  static identity() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static multiply(a, b) {
    const out = new Array(16);
    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        let value = 0;
        for (let k = 0; k < 4; k++) {
          value += a[k * 4 + row] * b[column * 4 + k];
        }
        out[column * 4 + row] = value;
      }
    }
    return out;
  }

  static translation(x, y, z) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ];
  }

  static scale(x, y, z) {
    return [
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ];
  }

  static rotateX(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  }

  static rotateY(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  }

  static rotateZ(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static perspective(fov, aspect, near, far) {
    const t = 1 / Math.tan(fov / 2);
    return [
      t / aspect, 0, 0, 0,
      0, t, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, 2 * far * near / (near - far), 0
    ];
  }

  static orthographic(left, right, bottom, top, near, far) {
    return [
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -2 / (far - near), 0,
      -(right + left) / (right - left),
      -(top + bottom) / (top - bottom),
      -(far + near) / (far - near),
      1
    ];
  }

  static lookAt(eye, center, up) {
    const z = this.normalize([eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]);
    const x = this.normalize(this.cross(up, z));
    const y = this.cross(z, x);
    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      this.dotFromEye(x, eye), this.dotFromEye(y, eye), this.dotFromEye(z, eye), 1
    ];
  }

  static normalize(vector) {
    const length = Math.hypot(...vector);
    return vector.map(value => value / length);
  }

  static cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  static dotFromEye(axis, eye) {
    return -(axis[0] * eye[0] + axis[1] * eye[1] + axis[2] * eye[2]);
  }

  static normal(matrix) {
    const c0 = [matrix[0], matrix[1], matrix[2]];
    const c1 = [matrix[4], matrix[5], matrix[6]];
    const c2 = [matrix[8], matrix[9], matrix[10]];
    const r0 = this.cross(c1, c2);
    const r1 = this.cross(c2, c0);
    const r2 = this.cross(c0, c1);
    const determinant = c0[0] * r0[0] + c0[1] * r0[1] + c0[2] * r0[2] || 1;
    return [
      r0[0], r1[0], r2[0],
      r0[1], r1[1], r2[1],
      r0[2], r1[2], r2[2]
    ].map(value => value / determinant);
  }
}
