# Flujo de prepago / anticipo en Admin → Reservaciones → Detalle

Documento de diseño para cuando el cliente paga un **adelanto** (anticipo) y el resto se paga después (en check-in o en otra fecha).

---

## 1. Conceptos

- **Total:** monto total de la reservación (ya existe en `reservations.total`).
- **Anticipo / prepago:** pago parcial que hace el cliente antes de la estancia (ej. 30% o un monto fijo).
- **Pagado (amount_paid):** suma de lo que el cliente ya ha pagado (anticipo + eventuales pagos posteriores).
- **Saldo pendiente:** `total - amount_paid`. Si es 0, la reservación está pagada por completo.

---

## 2. Flujo en Admin → Reservaciones → Detalle

1. **Desglose de pago** muestra:
   - Total de la reservación.
   - **Pagado:** lo que ya ingresó (anticipo + otros pagos).
   - **Saldo pendiente:** total − pagado (si es 0, mostrar "Pagado" o "Saldo cubierto").

2. **Registrar un pago (anticipo o abono):**
   - Botón tipo **"Registrar anticipo"** o **"Registrar pago"**.
   - Modal o formulario: monto, concepto opcional (Anticipo / Pago final / Abono), fecha opcional.
   - Al guardar: se actualiza el total pagado (o se inserta un movimiento) y, si aplica, se puede pasar la reservación a **Confirmada**.

3. **Estado de la reservación:**
   - **PENDIENTE:** sin pago o solo parte pagada (según política: ej. confirmar solo con anticipo).
   - **CONFIRMADA:** cuando se considera “confirmada” (ej. anticipo recibido, o pago total).
   - Opcional: mostrar un badge o texto tipo "Anticipo recibido" cuando `amount_paid > 0` pero `amount_paid < total`.

4. **Customer Journey (paso Pago):**
   - Mostrar "Pendiente" / "Anticipo recibido" / "Pagado" según `amount_paid` vs `total`.

---

## 3. Opciones de modelo de datos

### Opción A – Simple (una sola cifra pagada)

- En `reservations`:
  - **amount_paid** (numeric, default 0): lo que el cliente ha pagado hasta el momento.
- Cada vez que el admin “registra un pago”, se hace:  
  `amount_paid = amount_paid + monto_registrado`.  
- Ventaja: fácil de implementar y de mostrar (Total, Pagado, Saldo).  
- Desventaja: no hay historial de movimientos (quién pagó cuándo y por qué concepto).

### Opción B – Con historial de pagos

- Nueva tabla **reservation_payments**:  
  `id`, `reservation_id`, `amount`, `type` (anticipo | abono | pago_final | ajuste), `paid_at`, `created_at`, `created_by`, opcional `note`.
- **amount_paid** en la reservación = suma de `reservation_payments.amount` para esa reservación (o se calcula en consulta).
- Ventaja: auditoría, reportes y aclaraciones.  
- Desventaja: más desarrollo y más pantallas (listado de movimientos, etc.).

Recomendación: empezar con **Opción A**; si más adelante se necesita historial, añadir **Opción B** y seguir usando `amount_paid` como campo derivado o de respaldo.

---

## 4. Reglas sugeridas

- **Confirmar reservación:** por ejemplo, pasar a CONFIRMADA cuando `amount_paid >= total` o cuando `amount_paid >= X% del total` (ej. 30% de anticipo). Definir una regla y aplicarla al “Registrar pago”.
- **No permitir** que `amount_paid` supere a `total` (validación en backend y en front).
- **Cancelación:** definir si al cancelar se reintegra algo según lo ya pagado (eso sería lógica aparte de reembolsos).

---

## 5. Resumen

- En **Admin → Reservaciones → Detalle**: mostrar **Total**, **Pagado** y **Saldo pendiente**; botón **Registrar anticipo / pago** que actualice lo pagado y, si aplica, el estado.
- Modelo mínimo: columna **amount_paid** en `reservations`; opcional después: tabla de movimientos para historial.
- El cliente no ve esta lógica de “anticipo” en su pantalla salvo que quieras mostrarle “Pagado / Pendiente” en su vista de reservación (solo montos, sin pantalla de admin).
