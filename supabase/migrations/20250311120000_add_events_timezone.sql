ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS timezone text;
