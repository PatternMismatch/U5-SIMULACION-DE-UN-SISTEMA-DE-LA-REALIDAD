class GraficaAngulo {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.datos = []; // { t, deg }
    this.maxPuntos = 240;
  }

  limpiar() {
    this.datos = [];
    this.dibujar();
  }

  agregarPunto(t, rad) {
    const deg = (rad * 180) / Math.PI;
    this.datos.push({ t, deg });
    if (this.datos.length > this.maxPuntos) {
      this.datos.shift();
    }
    this.dibujar();
  }

  dibujar() {
    const { ctx, canvas, datos } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Línea cero (0°)
    const midY = h / 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (datos.length < 2) return;

    const maxAbsDeg = 90;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < datos.length; i++) {
      const x = (i / (this.maxPuntos - 1)) * w;
      const clampedDeg = Math.max(-maxAbsDeg, Math.min(maxAbsDeg, datos[i].deg));
      const y = midY - (clampedDeg / maxAbsDeg) * (h * 0.42);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }
}
