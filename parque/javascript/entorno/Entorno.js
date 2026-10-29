'use strict';

export default class Entorno {
  constructor(engine) {
    this.engine = engine;
    this.profiles = {
      day: {
        ambient: [.42, .43, .48],
        sunColor: [1, .88, .7],
        moonColor: [.46, .56, .78],
        sunStrength: 1.1,
        lampStrength: .08,
        fogColor: [.62, .78, .94],
        fogStart: 65,
        fogRange: 150,
        sky: [[39, 134, 199], [113, 196, 223], [255, 210, 123], [245, 179, 106]]
      },
      sunset: {
        ambient: [.34, .3, .42],
        sunColor: [1, .62, .35],
        moonColor: [.5, .61, .88],
        sunStrength: .95,
        lampStrength: 1.6,
        fogColor: [.93, .55, .32],
        fogStart: 45,
        fogRange: 100,
        sky: [[29, 27, 74], [122, 59, 107], [232, 136, 74], [245, 179, 106]]
      },
      night: {
        ambient: [.12, .15, .27],
        sunColor: [.27, .34, .62],
        moonColor: [.58, .69, 1],
        sunStrength: .35,
        lampStrength: 2.4,
        fogColor: [.08, .1, .2],
        fogStart: 35,
        fogRange: 100,
        sky: [[8, 13, 37], [24, 38, 75], [53, 68, 106], [102, 113, 138]]
      }
    };
    this.keyframes = [
      { hour: 0, profile: this.profiles.night },
      { hour: 5, profile: this.profiles.night },
      { hour: 6, profile: this.profiles.sunset },
      { hour: 8, profile: this.profiles.day },
      { hour: 16, profile: this.profiles.day },
      { hour: 18, profile: this.profiles.sunset },
      { hour: 20, profile: this.profiles.night },
      { hour: 24, profile: this.profiles.night }
    ];
    this.setHora(17);
  }

  setHora(hour) {
    if (!Number.isFinite(hour) || hour < 0 || hour > 24) {
      throw new RangeError(`Hora fuera de rango: ${hour}`);
    }
    const index = this.keyframes.findIndex(frame => frame.hour >= hour);
    const next = this.keyframes[index];
    const previous = this.keyframes[Math.max(0, index - 1)];
    const linearAmount = next.hour === previous.hour ? 0 : (hour - previous.hour) / (next.hour - previous.hour);
    const amount = linearAmount * linearAmount * (3 - 2 * linearAmount);
    const profile = {};

    Object.keys(previous.profile).forEach(key => {
      profile[key] = this.interpolate(previous.profile[key], next.profile[key], amount);
    });

    this.engine.setLighting(profile);
    this.engine.setBackground(profile.sky);
  }

  interpolate(start, end, amount) {
    if (Array.isArray(start)) {
      return start.map((value, index) => this.interpolate(value, end[index], amount));
    }
    return start + (end - start) * amount;
  }
}
