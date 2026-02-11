-- Admin puede ver todos los perfiles (para listar huéspedes en reservaciones)
CREATE POLICY "Admin ve todos los perfiles" ON public.profiles
  FOR SELECT USING (public.current_user_is_admin());
