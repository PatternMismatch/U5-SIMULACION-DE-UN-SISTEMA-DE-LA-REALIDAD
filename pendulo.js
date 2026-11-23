/**
 * Modelo matemático del péndulo amortiguado y lanzamiento balístico.
 * Sistema de EDOs de primer orden:
 *   d(theta)/dt = omega
 *   d(omega)/dt = -(g / L) * sin(theta) - (b / (m * L^2)) * omega
 */
class ModeloPendulo {
  constructor(params = {}) {
    this.L = params.L ?? 1.5;         // Longitud de cuerda (m)
    this.m = params.m ?? 1.0;         // Masa (kg)
    this.b = params.b ?? 0.15;        // Coeficiente de amortiguamiento
    this.g = params.g ?? 9.81;        // Gravedad (m/s^2)
    this.theta0Deg = params.theta0Deg ?? 45;

    this.theta = (this.theta0Deg * Math.PI) / 180; // Ángulo actual (rad)
    this.omega = 0;                                // Velocidad angular (rad/s)
    this.tiempo = 0;                               // Tiempo simulado (s)
  }

  setParametros({ L, m, b, g, theta0Deg }) {
    if (typeof L === "number") this.L = L;
    if (typeof m === "number") this.m = m;
    if (typeof b === "number") this.b = b;
    if (typeof g === "number") this.g = g;
    if (typeof theta0Deg === "number") this.theta0Deg = theta0Deg;
  }

  reiniciar() {
    this.theta = (this.theta0Deg * Math.PI) / 180;
    this.omega = 0;
    this.tiempo = 0;
  }

  /**
   * Período teórico para oscilaciones pequeñas: T = 2 * pi * sqrt(L / g)
   */
  getPeriodoTeorico() {
    return 2 * Math.PI * Math.sqrt(this.L / this.g);
  }

  /**
   * Derivadas del sistema en un estado (theta, omega)
   */
  derivadas(theta, omega) {
    const dTheta = omega;
    const dOmega =
      -(this.g / this.L) * Math.sin(theta) -
      (this.b / (this.m * this.L * this.L)) * omega;
    return { dTheta, dOmega };
  }

  /**
   * Integración numérica por Runge-Kutta de 4to orden (RK4)
   */
  pasoRK4(dt) {
    const t = this.theta;
    const w = this.omega;

    const k1 = this.derivadas(t, w);
    const k2 = this.derivadas(t + 0.5 * dt * k1.dTheta, w + 0.5 * dt * k1.dOmega);
    const k3 = this.derivadas(t + 0.5 * dt * k2.dTheta, w + 0.5 * dt * k2.dOmega);
    const k4 = this.derivadas(t + dt * k3.dTheta, w + dt * k3.dOmega);

    this.theta = t + (dt / 6) * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta);
    this.omega = w + (dt / 6) * (k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega);
    this.tiempo += dt;
  }

  /**
   * Posición relativa al pivote (en metros, +x a la derecha, +y hacia abajo)
   */
  getPosicionRelativa() {
    return {
      x: this.L * Math.sin(this.theta),
      y: this.L * Math.cos(this.theta)
    };
  }

  /**
   * Velocidad tangencial al soltar la masa en el instante actual.
   * Si theta > 0 (a la derecha) y omega > 0 (va hacia la derecha),
   * el vector tangente apunta hacia arriba-derecha o abajo-derecha según el signo.
   */
  getVelocidadSoltado() {
    // Vector unitario radial: (sin(theta), cos(theta))
    // Vector unitario tangente en sentido de theta creciente: (cos(theta), -sin(theta))
    const vx = this.L * this.omega * Math.cos(this.theta);
    const vy = -this.L * this.omega * Math.sin(this.theta);
    return { vx, vy };
  }
}
