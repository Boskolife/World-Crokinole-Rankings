ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS is_auto_created boolean NOT NULL DEFAULT false;
