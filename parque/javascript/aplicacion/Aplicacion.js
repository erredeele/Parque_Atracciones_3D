'use strict';

import Motor from '../renderizado/Motor.js';
import Camara from '../camara/Camara.js';
import Entorno from '../entorno/Entorno.js';
import EscenaParque from '../escena/EscenaParque.js';

export default class Aplicacion {
  constructor() {
    this.engine = new Motor('c');
    this.camera = new Camara(this.engine);
    this.environment = new Entorno(this.engine);
    this.scene = null;
    this.hora = 17;
    this.horarioEnMarcha = false;
    this.time = 0;
    this.speed = 1;
    this.paused = false;
    this.lastFrame = performance.now();
    this.status = document.getElementById('v');
    this.horaControl = document.getElementById('hora');
    this.horaActual = document.getElementById('hora-actual');
    this.botonHorario = document.getElementById('reproducir-horario');
    this.controlPanel = document.getElementById('control-panel');
    this.controlToggle = document.getElementById('control-toggle');
    this.controlContent = document.getElementById('control-content');
    this.drag = false;
    this.lastX = 0;
    this.lastY = 0;
    this.registerEvents();
  }

  async iniciar() {
    this.scene = await new EscenaParque(this.engine).build();
    this.setHora(this.hora);
    this.engine.resize();
    this.lastFrame = performance.now();
    requestAnimationFrame(now => this.frame(now));
  }

  registerEvents() {
    addEventListener('resize', () => this.engine.resize());
    this.controlToggle.addEventListener('click', () => this.toggleControls());
    this.engine.canvas.onmousedown = event => this.startDrag(event);
    addEventListener('mouseup', () => this.stopDrag());
    addEventListener('mousemove', event => this.moveCamera(event));
    this.engine.canvas.onwheel = event => this.zoomCamera(event);
    this.horaControl.addEventListener('input', event => this.setHora(Number(event.target.value)));
    this.botonHorario.addEventListener('click', () => this.alternarHorario());
    document.querySelectorAll('[data-camera-view]').forEach(button => {
      button.addEventListener('click', () => this.focusAttraction(button.dataset.cameraView));
    });
    addEventListener('keydown', event => this.handleKey(event));
  }

  toggleControls() {
    const isOpen = this.controlToggle.getAttribute('aria-expanded') !== 'true';
    this.controlToggle.setAttribute('aria-expanded', String(isOpen));
    this.controlToggle.setAttribute('aria-label', isOpen ? 'Ocultar controles' : 'Mostrar controles');
    this.controlContent.setAttribute('aria-hidden', String(!isOpen));
    this.controlContent.inert = !isOpen;
    this.controlPanel.classList.toggle('is-open', isOpen);
  }

  setHora(hour) {
    this.hora = Math.max(0, Math.min(24, hour));
    this.environment.setHora(this.hora);
    this.scene.setHora(this.hora);
    const totalMinutes = Math.round(this.hora * 60) % (24 * 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    this.horaActual.value = `${hours}:${minutes}`;
    this.horaActual.textContent = this.horaActual.value;
    this.horaControl.value = String(this.hora);
  }

  alternarHorario() {
    this.horarioEnMarcha = !this.horarioEnMarcha;
    this.botonHorario.setAttribute('aria-pressed', String(this.horarioEnMarcha));
    this.botonHorario.textContent = this.horarioEnMarcha ? 'Pausar día' : 'Iniciar día';
  }

  focusAttraction(view) {
    this.camera.go(view);
    document.querySelectorAll('[data-camera-view]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.cameraView === view));
    });
  }

  startDrag(event) {
    this.drag = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  stopDrag() {
    this.drag = false;
  }

  moveCamera(event) {
    if (!this.drag) return;
    this.camera.target.yaw -= (event.clientX - this.lastX) * .006;
    this.camera.target.pit = Math.min(
      1.5,
      Math.max(.05, this.camera.target.pit + (event.clientY - this.lastY) * .006)
    );
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  zoomCamera(event) {
    event.preventDefault();
    this.camera.target.d = Math.min(110, Math.max(8, this.camera.target.d * (1 + event.deltaY * .001)));
  }

  handleKey(event) {
    if ('123456'.includes(event.key)) this.focusAttraction(event.key);
    if (event.code === 'Space') {
      this.paused = !this.paused;
      event.preventDefault();
    }
    if (event.key === '+' || event.key === '=') {
      this.speed = Math.min(5, this.speed + .25);
    }
    if (event.key === '-') {
      this.speed = Math.max(.25, this.speed - .25);
    }
  }

  frame(now) {
    const delta = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    if (!this.paused) this.time += delta * this.speed;
    if (this.horarioEnMarcha) this.setHora((this.hora + delta * 24 / 240) % 24);
    this.status.textContent = this.paused ? 'PAUSA' : 'x' + this.speed.toFixed(2);
    this.camera.update();
    this.engine.render(this.scene, this.camera, this.time);
    requestAnimationFrame(nextFrame => this.frame(nextFrame));
  }
}
