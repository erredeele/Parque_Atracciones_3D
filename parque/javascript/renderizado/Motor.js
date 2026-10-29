'use strict';

import Matriz4 from '../matematicas/Matriz4.js';
import Malla from './Malla.js';
import NodoEscena from './NodoEscena.js';

const VERTEX_SHADER = `attribute vec3 aP,aN;attribute vec2 aT;
uniform mat4 uM,uVP,uLightVP;uniform mat3 uN;uniform vec2 uUV;
varying vec3 vP,vN;varying vec2 vT;varying vec4 vShadow;
void main(){vec4 w=uM*vec4(aP,1.);vP=w.xyz;vN=uN*aN;vT=aT*uUV;vShadow=uLightVP*w;gl_Position=uVP*w;}`;
const FRAGMENT_SHADER = `precision mediump float;
varying vec3 vP,vN;varying vec2 vT;varying vec4 vShadow;
uniform vec3 uCol,uCam,uSunD,uMoonD,uPL[6],uAmbient,uSunColor,uMoonColor,uFogColor;uniform sampler2D uS,uShadow;uniform vec2 uShadowTexel;uniform float uUse,uEm,uSh,uLamp,uSunStrength,uMoonStrength,uFogStart,uFogRange,uShadowSun,uFog;
float unpackDepth(vec4 color){return dot(color,vec4(1.,1./255.,1./65025.,1./16581375.));}
float shadowAmount(){
  vec3 p=vShadow.xyz/vShadow.w*.5+.5;
  if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z<0.||p.z>1.)return 1.;
  float blocked=0.;
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
    float depth=unpackDepth(texture2D(uShadow,p.xy+vec2(float(x),float(y))*uShadowTexel));
    blocked+=p.z-.0015>depth?1.:0.;
  }
  return 1.-blocked/9.*.9;
}
void main(){
  vec3 b=uCol; if(uUse>.5) b*=texture2D(uS,vT).rgb;
  if(uEm>.5){gl_FragColor=vec4(b,1.);return;}
  vec3 N=normalize(vN),V=normalize(uCam-vP),L=normalize(-uSunD),ML=normalize(-uMoonD);
  float d=max(dot(N,L),0.),md=max(dot(N,ML),0.);
  float shadow=shadowAmount();
  float sunVisibility=mix(1.,shadow,uShadowSun);
  float moonVisibility=mix(shadow,1.,uShadowSun);
  vec3 c=b*uAmbient+b*uSunColor*d*uSunStrength*sunVisibility+b*uMoonColor*md*uMoonStrength*moonVisibility;
  c+=vec3(1.,.8,.6)*pow(max(dot(N,normalize(L+V)),0.),uSh)*.25*step(.01,d)*uSunStrength*sunVisibility;
  for(int i=0;i<6;i++){vec3 D=uPL[i]-vP;float r=length(D);D/=r;
    c+=b*vec3(1.,.85,.5)*max(dot(N,D),0.)*uLamp/(1.+.08*r*r);}
  float f=clamp((length(uCam-vP)-uFogStart)/uFogRange,0.,1.)*uFog;
  gl_FragColor=vec4(mix(c,uFogColor,f),1.);
}`;
const SHADOW_VERTEX_SHADER = `attribute vec3 aP;uniform mat4 uM,uLightVP;void main(){gl_Position=uLightVP*uM*vec4(aP,1.);}`;
const SHADOW_FRAGMENT_SHADER = `precision mediump float;
vec4 packDepth(float depth){
  const vec4 shift=vec4(1.,255.,65025.,16581375.);
  const vec4 mask=vec4(1./255.,1./255.,1./255.,0.);
  vec4 color=fract(depth*shift);
  color-=color.yzww*mask;
  return color;
}
void main(){gl_FragColor=packDepth(gl_FragCoord.z);}`;

export default class Motor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext('webgl', { alpha: true });
    this.gl.enable(this.gl.DEPTH_TEST);
    this.program = this.createProgram();
    this.uniforms = this.getUniforms();
    this.shadowProgram = this.createShadowProgram();
    this.shadowTarget = this.createShadowTarget();
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = this.skyCanvas.height = 256;
    this.skyContext = this.skyCanvas.getContext('2d');
    this.skyTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.skyTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.useProgram(this.program);
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw this.gl.getShaderInfoLog(shader);
    }
    return shader;
  }

  createProgram() {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER));
    this.gl.attachShader(program, this.compileShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    ['aP', 'aN', 'aT'].forEach((attribute, index) => this.gl.bindAttribLocation(program, index, attribute));
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw this.gl.getProgramInfoLog(program);
    }
    return program;
  }

  createShadowProgram() {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.compileShader(this.gl.VERTEX_SHADER, SHADOW_VERTEX_SHADER));
    this.gl.attachShader(program, this.compileShader(this.gl.FRAGMENT_SHADER, SHADOW_FRAGMENT_SHADER));
    this.gl.bindAttribLocation(program, 0, 'aP');
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw this.gl.getProgramInfoLog(program);
    }
    return {
      program,
      model: this.gl.getUniformLocation(program, 'uM'),
      lightVP: this.gl.getUniformLocation(program, 'uLightVP')
    };
  }

  createShadowTarget() {
    const { gl } = this;
    const size = 1024;
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    const depth = gl.createRenderbuffer();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('No se pudo crear el mapa de sombras.');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    return { framebuffer, texture, size };
  }

  getUniforms() {
    const uniforms = {};
    [
      'uM', 'uVP', 'uLightVP', 'uN', 'uUV', 'uCol', 'uCam', 'uSunD', 'uMoonD', 'uPL', 'uS', 'uShadow',
      'uUse', 'uEm', 'uSh', 'uLamp', 'uAmbient', 'uSunColor', 'uMoonColor', 'uFogColor',
      'uSunStrength', 'uMoonStrength', 'uFogStart', 'uFogRange', 'uShadowTexel', 'uShadowSun', 'uFog'
    ]
      .forEach(name => uniforms[name] = this.gl.getUniformLocation(this.program, name));
    return uniforms;
  }

  createMesh(geometry) {
    return new Malla(this, geometry);
  }

  createNode(mesh, options, ...children) {
    return new NodoEscena(this, mesh, options).add(...children);
  }

  createTexture(drawTexture) {
    const source = document.createElement('canvas');
    source.width = source.height = 256;
    drawTexture(source.getContext('2d'));
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
    return texture;
  }

  createImageTexture(source) {
    const { gl } = this;
    const texture = gl.createTexture();
    const image = new Image();

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2 ** Math.floor(Math.log2(image.naturalWidth));
        canvas.height = 2 ** Math.floor(Math.log2(image.naturalHeight));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        resolve(texture);
      };
      image.onerror = () => reject(new Error(`No se pudo cargar la textura: ${source}`));
      image.src = source;
    });
  }

  resize() {
    this.canvas.width = innerWidth * devicePixelRatio;
    this.canvas.height = innerHeight * devicePixelRatio;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(scene, camera, time) {
    const { gl, uniforms } = this;
    const { eye, vp } = camera.matrices();
    const sunEnergy = this.lighting.sunStrength * scene.sunIntensity;
    const shadowSun = sunEnergy >= scene.moonIntensity;
    const direction = (shadowSun ? scene.sunDir : scene.moonDir).map(value => -value);
    const lightLength = Math.hypot(...direction);
    const lightPosition = direction.map(value => value / lightLength * 160);
    const lightUp = Math.abs(direction[1] / lightLength) > .95 ? [0, 0, 1] : [0, 1, 0];
    const lightVP = Matriz4.multiply(
      Matriz4.orthographic(-70, 70, -70, 70, 1, 350),
      Matriz4.lookAt(lightPosition, [0, 0, 0], lightUp)
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowTarget.framebuffer);
    gl.viewport(0, 0, this.shadowTarget.size, this.shadowTarget.size);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.shadowProgram.program);
    gl.uniformMatrix4fv(this.shadowProgram.lightVP, false, lightVP);
    scene.root.drawShadow(Matriz4.identity(), time, this.shadowProgram.model);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uniforms.uVP, false, vp);
    gl.uniformMatrix4fv(uniforms.uLightVP, false, lightVP);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowTarget.texture);
    gl.uniform1i(uniforms.uShadow, 1);
    gl.uniform2f(uniforms.uShadowTexel, 1 / this.shadowTarget.size, 1 / this.shadowTarget.size);
    gl.uniform1f(uniforms.uShadowSun, shadowSun ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform3fv(uniforms.uCam, eye);
    gl.uniform3fv(uniforms.uSunD, scene.sunDir);
    gl.uniform3fv(uniforms.uMoonD, scene.moonDir);
    gl.uniform3fv(uniforms.uPL, scene.lamps);
    gl.uniform3fv(uniforms.uAmbient, this.lighting.ambient);
    gl.uniform3fv(uniforms.uSunColor, this.lighting.sunColor);
    gl.uniform3fv(uniforms.uMoonColor, this.lighting.moonColor);
    gl.uniform3fv(uniforms.uFogColor, this.lighting.fogColor);
    gl.uniform1f(uniforms.uSunStrength, this.lighting.sunStrength * scene.sunIntensity);
    gl.uniform1f(uniforms.uMoonStrength, scene.moonIntensity);
    gl.uniform1f(uniforms.uLamp, this.lighting.lampStrength);
    gl.uniform1f(uniforms.uFogStart, this.lighting.fogStart);
    gl.uniform1f(uniforms.uFogRange, this.lighting.fogRange);
    gl.uniform1i(uniforms.uS, 0);
    scene.root.draw(Matriz4.identity(), time);
  }

  setLighting(profile) {
    this.lighting = profile;
  }

  setBackground(sky) {
    const stops = ['--cielo-superior', '--cielo-medio', '--cielo-horizonte', '--cielo-inferior'];
    stops.forEach((name, index) => {
      document.body.style.setProperty(name, `rgb(${sky[index].map(Math.round).join(' ')})`);
    });
    const gradient = this.skyContext.createLinearGradient(0, 0, 0, this.skyCanvas.height);
    sky.forEach((color, index) => {
      gradient.addColorStop(index / (sky.length - 1), `rgb(${color.map(Math.round).join(' ')})`);
    });
    this.skyContext.fillStyle = gradient;
    this.skyContext.fillRect(0, 0, this.skyCanvas.width, this.skyCanvas.height);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.skyTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.skyCanvas);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }
}
