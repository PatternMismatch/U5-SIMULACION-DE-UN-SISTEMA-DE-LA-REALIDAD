# Lanzamiento Balístico con Péndulo Amortiguado

Simulador físico y videojuego interactivo desarrollado en **HTML5 Canvas y JavaScript puro** para la cátedra de **Diseño y Control de Modelos** (Universidad Nacional Experimental Marítima del Caribe).

El proyecto modela el acoplamiento de dos fenómenos físicos reales: la **oscilación no lineal de un péndulo simple con amortiguamiento** y la **transición instantánea a un movimiento parabólico (lanzamiento balístico)** al liberar la masa en movimiento para impactar un objetivo.

---

## Descripción del Fenómeno Simulado

1. **Oscilación del péndulo amortiguado:** Una masa puntual $m$ suspendida de una cuerda inextensible de longitud $L$ oscila bajo la acción de la gravedad $g$ y una fuerza disipativa proporcional a la velocidad angular (coeficiente de amortiguamiento $b$). A diferencia de la aproximación lineal ($\sin\theta \approx \theta$), el simulador conserva la no linealidad de $\sin(\theta)$ y muestra la pérdida progresiva de energía mecánica.
2. **Transición a tiro parabólico:** Al presionar **Soltar / Lanzar** (o la tecla `Espacio`), la restricción de la cuerda desaparece de forma instantánea. La masa pasa a comportarse como un proyectil en caída libre bajo gravedad constante $g$, conservando su posición instantánea $(x_0, y_0)$ y su vector de velocidad tangencial $(v_{x0}, v_{y0})$ en el instante de liberación.

---

## Modelo Matemático e Implementación Numérica

### 1. Ecuaciones Diferenciales del Péndulo
La dinámica rotacional del péndulo amortiguado se formula en `pendulo.js` como un sistema de dos ecuaciones diferenciales ordinarias (EDOs) de primer orden:

$$\frac{d\theta}{dt} = \omega$$

$$\frac{d\omega}{dt} = -\frac{g}{L}\sin(\theta) - \frac{b}{m L^2}\omega$$

* **Integración numérica (RK4):** El sistema se resuelve en tiempo real mediante el método de **Runge-Kutta de cuarto orden (RK4)** (`ModeloPendulo.pasoRK4`), subdividiendo cada fotograma de animación (`requestAnimationFrame`, acotado a $\Delta t \le 0.05\text{ s}$) en `6` subpasos ($h = \Delta t / 6$) para garantizar estabilidad numérica.
* **Período de referencia:** La telemetría calcula el período analítico para pequeñas oscilaciones $T = 2\pi\sqrt{L/g}$, permitiendo contrastarlo frente al comportamiento no lineal y amortiguado observado en la simulación.

### 2. Cinemática del Lanzamiento Balístico
En el instante de liberación, se proyectan la posición relativa al pivote y la velocidad tangencial hacia el sistema de coordenadas del escenario ($+x$ a la derecha, $+y$ hacia abajo):

$$x_0 = L\sin(\theta), \qquad y_0 = L\cos(\theta)$$

$$v_{x0} = L\omega\cos(\theta), \qquad v_{y0} = -L\omega\sin(\theta)$$

Durante la fase de vuelo libre, la trayectoria se integra paso a paso bajo aceleración gravitatoria constante:

$$v_y(t + h) = v_y(t) + g \cdot h$$

$$x(t + h) = x(t) + v_x \cdot h, \qquad y(t + h) = y(t) + v_y(t + h) \cdot h$$

---

## Variables y Parámetros Configurables

La interfaz permite modificar en tiempo real los parámetros físicos del modelo y observar su efecto inmediato sobre la oscilación y el alcance del proyectil:

| Parámetro | Símbolo | Rango | Unidad | Efecto en el sistema |
| :--- | :---: | :---: | :---: | :--- |
| **Longitud de cuerda** | $L$ | `0.60 – 2.60` | $\text{m}$ | Modifica el período natural y la velocidad tangencial $v = \omega L$. |
| **Masa** | $m$ | `0.20 – 5.00` | $\text{kg}$ | Afecta el término de amortiguamiento angular $b/(mL^2)$ y el radio de colisión. |
| **Amortiguamiento** | $b$ | `0.00 – 1.50` | $\text{N}\cdot\text{m}\cdot\text{s}$ | Controla la disipación de energía y el decaimiento exponencial de $\theta(t)$. |
| **Ángulo inicial** | $\theta_0$ | `-75° – 75°` | $^{\circ}$ | Define la amplitud inicial y la energía potencial gravitatoria de partida. |
| **Gravedad** | $g$ | `1.62 – 20.00` | $\text{m/s}^2$ | Permite simular desde gravedad lunar ($1.62\text{ m/s}^2$) hasta entornos de alta gravedad. |

---

## Funcionalidades del Simulador

* **Telemetría en tiempo real:** Visualización instantánea del ángulo $\theta$ ($^{\circ}$), velocidad angular $\omega$ ($\text{rad/s}$), período teórico $T$ ($\text{s}$) y marcador de **Aciertos / Intentos**.
* **Gráfica dinámica $\theta(t)$:** Representación en vivo de la respuesta angular en una ventana móvil de hasta `240` muestras (`grafica.js`).
* **Registro experimental de lanzamientos:** Tabla historial que almacena cada intento con su ángulo de suelta ($\theta_{\text{suelta}}$), rapidez inicial ($v_0$), configuración ($L / \theta_0$), distancia mínima alcanzada al centro del objetivo ($\text{cm}$) y estado (**Acierto** o **Fallo**, evaluado contra un objetivo circular de radio $0.22\text{ m}$).
* **Controles rápidos:** Botón de disparo / tecla `Espacio`, reinicio de ronda y reposicionamiento aleatorio del objetivo.

---

## Estructura del Proyecto

```text
├── index.html      # Estructura de la interfaz, controles deslizantes, telemetría y tabla de registro
├── styles.css      # Estilos visuales responsivos y diseño de paneles
├── pendulo.js      # Modelo matemático (EDOs, integrador RK4, cinemática tangencial y período teórico)
├── grafica.js      # Renderizado en Canvas de la serie temporal θ(t)
└── juego.js        # Bucle principal, física del proyectil, detección de colisiones y gestión de UI
```

---

## Cómo Ejecutar el Proyecto

No requiere instalación de dependencias ni servidores externos:

1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   ```
2. Abre el archivo `index.html` directamente en cualquier navegador web moderno (Chrome, Edge, Firefox, Brave).
3. Ajusta los parámetros en el panel lateral y presiona **Soltar / Lanzar** (o la barra espaciadora) en el instante oportuno para impactar el objetivo.

---

## Autores

* **Bastidas, María** — C.I: V-28.458.722
* **Bracho, Miguel** — C.I: V-30.526.776

**Asignatura:** Diseño y Control de Modelos — Ingeniería Informática, Sección "A"  
**Docente:** Prof. Ladiz Felibertt
