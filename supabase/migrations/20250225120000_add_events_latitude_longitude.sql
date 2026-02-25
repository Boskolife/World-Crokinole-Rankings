ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

UPDATE public.events SET latitude = 43.6532,  longitude = -79.3832  WHERE location ILIKE '%Toronto%';
UPDATE public.events SET latitude = 41.8781,  longitude = -87.6298  WHERE location ILIKE '%Chicago%';
UPDATE public.events SET latitude = 51.5074,  longitude = -0.1278   WHERE location ILIKE '%London%';
UPDATE public.events SET latitude = 40.7128,  longitude = -74.0060  WHERE location ILIKE '%New York%';
UPDATE public.events SET latitude = 42.3601,  longitude = -71.0589  WHERE location ILIKE '%Boston%';
UPDATE public.events SET latitude = 49.2827,  longitude = -123.1207 WHERE location ILIKE '%Vancouver%';
UPDATE public.events SET latitude = 42.3314,  longitude = -83.0458  WHERE location ILIKE '%Detroit%';
UPDATE public.events SET latitude = 48.8566,  longitude = 2.3522    WHERE location ILIKE '%Paris%';
UPDATE public.events SET latitude = 45.5017,  longitude = -73.5673  WHERE location ILIKE '%Montreal%';
UPDATE public.events SET latitude = 39.9526,  longitude = -75.1652  WHERE location ILIKE '%Philadelphia%';
UPDATE public.events SET latitude = 40.4212,  longitude = -79.7881  WHERE location ILIKE '%Monroeville%';
UPDATE public.events SET latitude = 40.7128,  longitude = -74.0060  WHERE latitude IS NULL AND longitude IS NULL;
