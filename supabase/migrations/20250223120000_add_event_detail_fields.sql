ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS strength_of_field integer,
  ADD COLUMN IF NOT EXISTS tournament_points_available integer,
  ADD COLUMN IF NOT EXISTS structure text;

UPDATE public.events
SET
  strength_of_field = COALESCE(strength_of_field, 800 + (id * 37) % 600),
  tournament_points_available = COALESCE(tournament_points_available, 100 + (id * 11) % 150),
  structure = COALESCE(structure, CASE (id % 4) WHEN 0 THEN 'Round Robin' WHEN 1 THEN 'Single Elimination' WHEN 2 THEN 'Double Elimination' ELSE 'Swiss System' END)
WHERE strength_of_field IS NULL OR tournament_points_available IS NULL OR structure IS NULL OR structure = '';
