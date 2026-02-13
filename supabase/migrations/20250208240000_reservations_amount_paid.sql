-- Prepago / anticipo: monto que el cliente ya ha pagado (adelantos, abonos).
-- Saldo pendiente = total - amount_paid.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.reservations.amount_paid IS 'Suma de lo ya pagado por el cliente (anticipo, abonos). Saldo = total - amount_paid.';
