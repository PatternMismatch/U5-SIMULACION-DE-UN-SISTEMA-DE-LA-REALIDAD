(() => {
  const juegoCanvas = document.getElementById("juegoCanvas");
  const ctx = juegoCanvas.getContext("2d");
  const graficaCanvas = document.getElementById("graficaCanvas");
  const grafica = new GraficaAngulo(graficaCanvas);

  // Elementos UI
  const inputs = {
    L: document.getElementById("inputLongitud"),
    m: document.getElementById("inputMasa"),
    b: document.getElementById("inputAmort"),
    theta0: document.getElementById("inputAngulo"),
    g: document.getElementById("inputGravedad")
  };

  const labels = {
    L: document.getElementById("valLongitud"),
    m: document.getElementById("valMasa"),
    b: document.getElementById("valAmort"),
    theta0: document.getElementById("valAngulo"),
    g: document.getElementById("valGravedad")
  };

  const metrics = {
    theta: document.getElementById("metricTheta"),
    omega: document.getElementById("metricOmega"),
    periodo: document.getElementById("metricPeriodo"),
    score: document.getElementById("metricScore")
  };

  const btnLanzar = document.getElementById("btnLanzar");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnNuevoObjetivo = document.getElementById("btnNuevoObjetivo");
  const btnLimpiarHistorial = document.getElementById("btnLimpiarHistorial");
  const historialBody = document.getElementById("historialBody");
  const statusBanner = document.getElementById("statusBanner");

  // Estado del modelo y del juego
  const modelo = new ModeloPendulo();
  let fase = "oscilando"; // "oscilando" | "proyectil" | "resuelto"
  let proyectil = null; // { x, y, vx, vy, trail, minDist, thetaSuelta, v0 }
  let trailPendulo = [];
  let aciertos = 0;
  let intentos = 0;

  // Escala y posiciones en metros
  let ppm = 105;
  let pivote = { x: 150, y: 62 };
  let sueloY = 360;

  // Objetivo en coordenadas físicas (metros desde pivote)
  let objetivo = {
    x: 1.95,
    y: 1.85,
    radio: 0.22
  };

  function redimensionarCanvas() {
    const rect = juegoCanvas.parentElement.getBoundingClientRect();
    juegoCanvas.width = Math.max(320, Math.floor(rect.width));
    juegoCanvas.height = Math.max(300, Math.floor(rect.height));

    sueloY = juegoCanvas.height - 44;
    pivote.y = Math.max(48, Math.round(juegoCanvas.height * 0.13));
    pivote.x = Math.max(95, Math.min(juegoCanvas.width * 0.28, 230));

    const altoDisponible = Math.max(200, sueloY - pivote.y - 34);
    const anchoDisponible = Math.max(240, juegoCanvas.width - pivote.x - 45);
    ppm = Math.min(anchoDisponible / 3.4, altoDisponible / 2.85);

    const maxYObjetivo = Math.max(0.7, (sueloY - pivote.y - 26) / ppm);
    if (objetivo.y > maxYObjetivo) {
      objetivo.y = Number(maxYObjetivo.toFixed(2));
    }

    const maxXObjetivo = Math.max(0.9, (juegoCanvas.width - pivote.x - 42) / ppm);
    if (objetivo.x > maxXObjetivo) {
      objetivo.x = Number(maxXObjetivo.toFixed(2));
    }
  }

  function actualizarEtiquetasParametros() {
    labels.L.textContent = `${Number(inputs.L.value).toFixed(2)} m`;
    labels.m.textContent = `${Number(inputs.m.value).toFixed(2)} kg`;
    labels.b.textContent = `${Number(inputs.b.value).toFixed(2)}`;
    labels.theta0.textContent = `${Number(inputs.theta0.value)}°`;
    labels.g.textContent = `${Number(inputs.g.value).toFixed(2)} m/s²`;
  }

  function aplicarParametrosYReiniciar() {
    actualizarEtiquetasParametros();
    modelo.setParametros({
      L: parseFloat(inputs.L.value),
      m: parseFloat(inputs.m.value),
      b: parseFloat(inputs.b.value),
      g: parseFloat(inputs.g.value),
      theta0Deg: parseFloat(inputs.theta0.value)
    });
    modelo.reiniciar();
    fase = "oscilando";
    proyectil = null;
    trailPendulo = [];
    btnLanzar.disabled = false;
    grafica.limpiar();
    setBanner(
      "Parámetros actualizados. Presiona <strong>Soltar / Lanzar</strong> (o <strong>Espacio</strong>) en el momento oportuno.",
      ""
    );
    actualizarMetricas();
  }

  function moverObjetivo() {
    const maxAlcanceX = Math.max(1.0, (juegoCanvas.width - pivote.x - 48) / ppm);
    const alturaSueloMetros = Math.max(0.9, (sueloY - pivote.y - 26) / ppm);

    objetivo.x = Number((0.75 + Math.random() * Math.max(0.4, maxAlcanceX - 0.85)).toFixed(2));
    objetivo.y = Number(
      (
        Math.min(
          alturaSueloMetros - 0.1,
          0.85 + Math.random() * Math.max(0.3, alturaSueloMetros - 0.95)
        )
      ).toFixed(2)
    );
    reiniciarRonda();
  }

  function reiniciarRonda() {
    modelo.reiniciar();
    fase = "oscilando";
    proyectil = null;
    trailPendulo = [];
    btnLanzar.disabled = false;
    grafica.limpiar();
    setBanner(
      "Nueva ronda lista. Observa la oscilación y suelta la masa para alcanzar el objetivo.",
      ""
    );
  }

  function registrarLanzamiento(acerto, distMinMetros) {
    const filaVacia = historialBody.querySelector(".empty-row");
    if (filaVacia) filaVacia.remove();

    const tr = document.createElement("tr");
    const distCm = `${(distMinMetros * 100).toFixed(1)} cm`;
    const badgeHtml = acerto
      ? `<span class="tag-hit">Acierto</span>`
      : `<span class="tag-miss">Fallo</span>`;

    tr.innerHTML = `
      <td>${intentos}</td>
      <td>${proyectil.thetaSuelta.toFixed(1)}°</td>
      <td>${proyectil.v0.toFixed(2)} m/s</td>
      <td>${modelo.L.toFixed(2)}m / ${modelo.theta0Deg}°</td>
      <td>${distCm}</td>
      <td>${badgeHtml}</td>
    `;

    historialBody.prepend(tr);
  }

  function limpiarHistorial() {
    historialBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Aún no se han realizado lanzamientos.</td>
      </tr>
    `;
  }

  function soltarMasa() {
    if (fase !== "oscilando") return;

    const pos = modelo.getPosicionRelativa();
    const vel = modelo.getVelocidadSoltado();
    const distInicial = Math.hypot(pos.x - objetivo.x, pos.y - objetivo.y);
    const thetaSueltaDeg = (modelo.theta * 180) / Math.PI;
    const rapidez = Math.hypot(vel.vx, vel.vy);

    proyectil = {
      x: pos.x,
      y: pos.y,
      vx: vel.vx,
      vy: vel.vy,
      trail: [{ x: pos.x, y: pos.y }],
      minDist: distInicial,
      thetaSuelta: thetaSueltaDeg,
      v0: rapidez
    };

    fase = "proyectil";
    btnLanzar.disabled = true;
    intentos += 1;

    setBanner(`Masa liberada con rapidez inicial de <strong>${rapidez.toFixed(2)} m/s</strong>...`, "");
    actualizarMetricas();
  }

  function setBanner(html, tipo) {
    statusBanner.innerHTML = html;
    statusBanner.className = "status-banner";
    if (tipo) statusBanner.classList.add(tipo);
  }

  function actualizarMetricas() {
    const deg = (modelo.theta * 180) / Math.PI;
    metrics.theta.textContent = `${deg.toFixed(1)}°`;
    metrics.omega.textContent = `${modelo.omega.toFixed(2)} rad/s`;
    metrics.periodo.textContent = `${modelo.getPeriodoTeorico().toFixed(2)} s`;
    metrics.score.textContent = `${aciertos} / ${intentos}`;
  }

  function fisToCanvas(xMetros, yMetros) {
    return {
      px: pivote.x + xMetros * ppm,
      py: pivote.y + yMetros * ppm
    };
  }

  function pasoSimulacion(dt) {
    const subSteps = 6;
    const h = dt / subSteps;

    if (fase === "oscilando") {
      for (let i = 0; i < subSteps; i++) {
        modelo.pasoRK4(h);
      }
      const pos = modelo.getPosicionRelativa();
      trailPendulo.push(pos);
      if (trailPendulo.length > 35) trailPendulo.shift();
      grafica.agregarPunto(modelo.tiempo, modelo.theta);
    } else if (fase === "proyectil" && proyectil) {
      for (let i = 0; i < subSteps; i++) {
        proyectil.vy += modelo.g * h;
        proyectil.x += proyectil.vx * h;
        proyectil.y += proyectil.vy * h;

        const dist = Math.hypot(proyectil.x - objetivo.x, proyectil.y - objetivo.y);
        if (dist < proyectil.minDist) {
          proyectil.minDist = dist;
        }

        const posCanvas = fisToCanvas(proyectil.x, proyectil.y);
        const maxXMeters = (juegoCanvas.width - pivote.x + 25) / ppm;
        const minXMeters = (-pivote.x - 25) / ppm;
        const radioMasaMetros = (10 + modelo.m * 2.1) / ppm;

        if (dist <= objetivo.radio + radioMasaMetros) {
          proyectil.trail.push({ x: proyectil.x, y: proyectil.y });
          aciertos += 1;
          fase = "resuelto";
          registrarLanzamiento(true, proyectil.minDist);
          setBanner(
            `<strong>¡Acierto!</strong> Impactaste el objetivo (distancia mínima al centro: <strong>${(proyectil.minDist * 100).toFixed(1)} cm</strong>). Presiona <strong>Reiniciar</strong> o <strong>Mover objetivo</strong>.`,
            "success"
          );
          actualizarMetricas();
          return;
        }

        if (
          posCanvas.py >= sueloY ||
          proyectil.x > maxXMeters ||
          proyectil.x < minXMeters
        ) {
          if (posCanvas.py >= sueloY) {
            proyectil.y = (sueloY - pivote.y) / ppm;
            const distFinal = Math.hypot(proyectil.x - objetivo.x, proyectil.y - objetivo.y);
            if (distFinal < proyectil.minDist) {
              proyectil.minDist = distFinal;
            }
          }
          proyectil.trail.push({ x: proyectil.x, y: proyectil.y });
          if (proyectil.trail.length > 70) proyectil.trail.shift();
          fase = "resuelto";
          registrarLanzamiento(false, proyectil.minDist);
          setBanner(
            `<strong>Tiro fallido.</strong> Distancia mínima al objetivo: <strong>${(proyectil.minDist * 100).toFixed(1)} cm</strong>. Ajusta variables o el momento de suelta y reintenta.`,
            "miss"
          );
          actualizarMetricas();
          return;
        }
      }

      proyectil.trail.push({ x: proyectil.x, y: proyectil.y });
      if (proyectil.trail.length > 70) proyectil.trail.shift();
    }

    actualizarMetricas();
  }

  function dibujarCuadricula() {
    const pasoPx = Math.max(28, ppm * 0.5);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;

    for (let x = pivote.x % pasoPx; x < juegoCanvas.width; x += pasoPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sueloY);
      ctx.stroke();
    }

    for (let y = pivote.y % pasoPx; y < sueloY; y += pasoPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(juegoCanvas.width, y);
      ctx.stroke();
    }
  }

  function dibujarEscena() {
    ctx.clearRect(0, 0, juegoCanvas.width, juegoCanvas.height);

    dibujarCuadricula();

    // Suelo
    const gradSuelo = ctx.createLinearGradient(0, sueloY, 0, juegoCanvas.height);
    gradSuelo.addColorStop(0, "#1e3a5f");
    gradSuelo.addColorStop(1, "#0f1c34");
    ctx.fillStyle = gradSuelo;
    ctx.fillRect(0, sueloY, juegoCanvas.width, juegoCanvas.height - sueloY);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, sueloY);
    ctx.lineTo(juegoCanvas.width, sueloY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(125, 211, 252, 0.16)";
    ctx.lineWidth = 1.5;
    for (let x = -20; x < juegoCanvas.width + 20; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, sueloY + 2);
      ctx.lineTo(x - 14, juegoCanvas.height);
      ctx.stroke();
    }

    // Soporte superior del pivote
    ctx.fillStyle = "#334155";
    ctx.fillRect(pivote.x - 42, pivote.y - 12, 84, 8);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.strokeRect(pivote.x - 42, pivote.y - 12, 84, 8);

    // Línea vertical de referencia (0°)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pivote.x, pivote.y);
    ctx.lineTo(pivote.x, Math.min(sueloY, pivote.y + modelo.L * ppm + 24));
    ctx.stroke();
    ctx.setLineDash([]);

    // Objetivo
    const objCanvas = fisToCanvas(objetivo.x, objetivo.y);
    const objRadioPx = objetivo.radio * ppm;

    ctx.beginPath();
    ctx.arc(objCanvas.px, objCanvas.py, objRadioPx, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#34d399";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(objCanvas.px, objCanvas.py, objRadioPx * 0.58, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(110, 231, 183, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(objCanvas.px, objCanvas.py, Math.max(4.5, objRadioPx * 0.22), 0, Math.PI * 2);
    ctx.fillStyle = "#a7f3d0";
    ctx.fill();

    // Estela del péndulo
    if (trailPendulo.length > 1) {
      for (let i = 1; i < trailPendulo.length; i++) {
        const p1 = fisToCanvas(trailPendulo[i - 1].x, trailPendulo[i - 1].y);
        const p2 = fisToCanvas(trailPendulo[i].x, trailPendulo[i].y);
        ctx.strokeStyle = `rgba(56, 189, 248, ${(i / trailPendulo.length) * 0.55})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
    }

    // Estela del proyectil
    if (proyectil && proyectil.trail.length > 1) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      proyectil.trail.forEach((pt, idx) => {
        const c = fisToCanvas(pt.x, pt.y);
        if (idx === 0) ctx.moveTo(c.px, c.py);
        else ctx.lineTo(c.px, c.py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Péndulo activo o proyectil
    const radioMasa = 10 + modelo.m * 2.1;
    if (fase === "oscilando") {
      const pos = modelo.getPosicionRelativa();
      const bob = fisToCanvas(pos.x, pos.y);

      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(pivote.x, pivote.y);
      ctx.lineTo(bob.px, bob.py);
      ctx.stroke();

      const gradBob = ctx.createRadialGradient(
        bob.px - radioMasa * 0.3,
        bob.py - radioMasa * 0.3,
        2,
        bob.px,
        bob.py,
        radioMasa
      );
      gradBob.addColorStop(0, "#bae6fd");
      gradBob.addColorStop(0.55, "#38bdf8");
      gradBob.addColorStop(1, "#0284c7");

      ctx.beginPath();
      ctx.arc(bob.px, bob.py, radioMasa, 0, Math.PI * 2);
      ctx.fillStyle = gradBob;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    } else if (proyectil) {
      const bob = fisToCanvas(proyectil.x, proyectil.y);
      const gradProj = ctx.createRadialGradient(
        bob.px - radioMasa * 0.3,
        bob.py - radioMasa * 0.3,
        2,
        bob.px,
        bob.py,
        radioMasa
      );
      gradProj.addColorStop(0, "#fef08a");
      gradProj.addColorStop(0.6, "#f59e0b");
      gradProj.addColorStop(1, "#d97706");

      ctx.beginPath();
      ctx.arc(bob.px, bob.py, radioMasa, 0, Math.PI * 2);
      ctx.fillStyle = gradProj;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fef9c3";
      ctx.stroke();
    }

    // Pivote superior
    ctx.beginPath();
    ctx.arc(pivote.x, pivote.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#38bdf8";
    ctx.stroke();
  }

  let ultimoTimestamp = null;
  function buclePrincipal(timestamp) {
    if (ultimoTimestamp !== null) {
      const dt = Math.min(0.05, (timestamp - ultimoTimestamp) / 1000);
      pasoSimulacion(dt);
    }
    ultimoTimestamp = timestamp;
    dibujarEscena();
    requestAnimationFrame(buclePrincipal);
  }

  // Eventos de interfaz
  Object.values(inputs).forEach((input) => {
    input.addEventListener("input", aplicarParametrosYReiniciar);
  });

  btnLanzar.addEventListener("click", soltarMasa);
  btnReiniciar.addEventListener("click", reiniciarRonda);
  btnNuevoObjetivo.addEventListener("click", moverObjetivo);
  btnLimpiarHistorial.addEventListener("click", limpiarHistorial);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (fase === "oscilando") soltarMasa();
      else reiniciarRonda();
    }
  });

  window.addEventListener("resize", redimensionarCanvas);

  // Inicialización
  redimensionarCanvas();
  actualizarEtiquetasParametros();
  actualizarMetricas();
  requestAnimationFrame(buclePrincipal);
})();

