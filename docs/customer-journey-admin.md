# Customer Journey en Admin → Reservaciones → Detalle

Documento de diseño **antes de programar**: define etapas, datos y reglas para el flujo de “viaje del cliente” en la pantalla de detalle de una reservación.

---

## 1. Ubicación

- **Flujo:** Admin Dashboard → Reservaciones → [Detalle de una reservación]
- **Componente:** Dentro de `AdminReservationDetail`, como sección fija (por ejemplo debajo del encabezado o del resumen de la reserva).
- **Título:** “Customer Journey” y a la derecha “Estado actual: [nombre de la etapa]”.

---

## 2. Etapas (4 pasos)

| # | Etapa       | Descripción breve                    | Texto bajo el nombre (ejemplo)   |
|---|-------------|--------------------------------------|----------------------------------|
| 1 | **Reserva** | Reserva creada en el sistema         | Fecha/hora creación (ej. 20 Oct, 14:30) |
| 2 | **Pago**    | Pago confirmado                      | Fecha/hora pago o “Pendiente”    |
| 3 | **Check-in**  | Entrada del huésped                 | Fecha check-in, “Previsto …” o “En progreso” |
| 4 | **Checkout**  | Salida del huésped                 | “Previsto [fecha], 11:00” o “Completado” |

---

## 3. Datos necesarios

### 3.1 Lo que ya existe en `reservations`

- `created_at` → para **Reserva** (fecha/hora de creación).
- `check_in` (date) → inicio de estancia (para saber cuándo empieza “Estancia” y “Preparando”).
- `check_out` (date) → fin de estancia (para **Checkout** programado).
- `status` → `PENDIENTE` | `CONFIRMADA` | `CHECKOUT` | `CANCELADA`.

### 3.2 Lo que no está en BD (opciones antes de programar)

Para que cada etapa tenga fecha/hora real (como en la imagen) hace falta decidir:

| Etapa       | Dato sugerido     | Origen posible                                      |
|-------------|-------------------|-----------------------------------------------------|
| Pago        | `paid_at` (timestamptz) | Al confirmar pago (pasarela o marcado manual por admin). |
| Preparando  | `preparing_at` (timestamptz) | Opcional: admin/sistema lo marca, o derivado (ej. día antes de check_in). |
| Check-in   | `checked_in_at` (timestamptz) | Al hacer check-in real (admin o recepción).        |
| Estancia   | —                 | Se deduce: entre `checked_in_at` y `checked_out_at` (o check_out date). |
| Checkout   | `checked_out_at` (timestamptz) | Al hacer checkout real. Si no existe, mostrar `check_out` como “previsto”. |

**Opción mínima (sin nuevas columnas):**  
Usar solo `created_at`, `check_in`, `check_out` y `status`, y mostrar:
- Reserva: `created_at`.
- Pago: mismo que Reserva o “—” si no hay dato.
- Preparando: “—” o “Desde día anterior a check-in”.
- Check-in: “—” o fecha `check_in` como “previsto”.
- Estancia: “En progreso” si hoy está entre check_in y check_out; si no, “En progreso” o “Completado” según fecha.
- Checkout: `check_out` como “Previsto 28 Oct, 11:00” (o hora por defecto).

**Opción completa (con nuevas columnas):**  
Añadir en una migración: `paid_at`, `preparing_at`, `checked_in_at`, `checked_out_at` (todos opcionales) y rellenarlos cuando corresponda en el flujo real.

---

## 4. Regla para “Estado actual”

Se debe poder calcular **qué etapa está “en progreso”** (y cuáles completadas / futuras).

Sugerencia de lógica (con datos actuales):

1. **CANCELADA** → Mostrar journey hasta la última etapa con dato (o hasta “Reserva”) y estado “Cancelada”.
2. **Reserva** = siempre completada (hay `created_at`).
3. **Pago** = completada si `status` no es `PENDIENTE` (o si existe `paid_at`).
4. **Preparando** = completada si la fecha actual ≥ `check_in` o si existe `preparing_at`.
5. **Check-in** = completada si hay `checked_in_at` o si fecha actual > `check_in` (check-in “asumido”).
6. **Estancia** = **en progreso** si hoy está entre `check_in` y `check_out` (inclusive) y no hay `checked_out_at`.
7. **Checkout** = completada si `status = 'CHECKOUT'` o si existe `checked_out_at` o si hoy > `check_out`; si no, **pendiente** (mostrar fecha prevista).

Orden sugerido para decidir “estado actual”:

- Si existe `checked_out_at` o `status = 'CHECKOUT'` → estado actual = **Checkout** (todas las anteriores completadas).
- Si no y hoy ∈ [check_in, check_out] → estado actual = **Estancia**.
- Si no y hoy ≥ check_in → estado actual = **Check-in** (o Checkout si ya pasó check_out).
- Si no y hay “preparación” o estamos en rango pre-check-in → estado actual = **Preparando**.
- Si no y pago confirmado → estado actual = **Pago**.
- Si no → estado actual = **Reserva**.

Así se puede pintar “completado” / “en progreso” / “pendiente” para cada paso.

---

## 5. Diseño visual (como en la imagen)

- **Línea horizontal** que une todos los pasos; segmentos **completados** en azul oscuro, **pendientes** en gris claro.
- **Cada paso:**
  - **Completado:** círculo relleno azul oscuro + icono de check blanco; debajo: nombre en negrita y fecha/hora en gris.
  - **En progreso:** círculo con borde azul claro, fondo blanco, icono representativo (ej. edificio para Estancia); nombre en azul; debajo: “En progreso” en gris.
  - **Pendiente:** círculo en gris claro con icono gris; texto en gris; debajo: fecha prevista si aplica (ej. “28 Oct, 11:00” para Checkout).
- **Estado actual** repetido arriba a la derecha: “Estado actual: Estancia” (o la etapa que sea), en azul.

Iconos sugeridos (Material Symbols o similar):

- Reserva: check o “event”.
- Pago: check o “payments”.
- Preparando: check o “inventory”.
- Check-in: check o “login”.
- Estancia: “apartment” / “hotel”.
- Checkout: “logout” / “arrow forward” saliendo de caja.

---

## 6. Resumen antes de programar

1. **Decidir nivel de detalle:** ¿solo con `created_at` + `check_in` + `check_out` + `status`, o añadir columnas `paid_at`, `preparing_at`, `checked_in_at`, `checked_out_at`?
2. **Fijar la regla** de “estado actual” (como en la sección 4) y documentarla en código o en este doc.
3. **Implementar el componente** de timeline en `AdminReservationDetail`: título “Customer Journey”, estado actual, 6 nodos con línea, y textos según datos disponibles.
4. **(Opcional)** Añadir migración y flujos para rellenar los timestamps nuevos cuando el pago se confirme, al hacer check-in/checkout real, etc.

Con esto el flujo Admin → Reservaciones → Detalle queda definido para implementar el Customer Journey como en la imagen.
