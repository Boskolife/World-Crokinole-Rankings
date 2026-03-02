ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS heat_index integer;
