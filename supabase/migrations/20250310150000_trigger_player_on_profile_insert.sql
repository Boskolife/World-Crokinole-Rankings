CREATE OR REPLACE FUNCTION public.ensure_player_for_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE user_id = NEW.id) THEN
        INSERT INTO public.players (
            user_id,
            name,
            country_code,
            kingdom,
            club,
            rating,
            is_auto_created
        ) VALUES (
            NEW.id,
            COALESCE(trim(NEW.full_name), ''),
            COALESCE(trim(NEW.country), ''),
            '',
            COALESCE(trim(NEW.club), ''),
            1500,
            true
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ensure_player_on_profile_insert ON public.profiles;
CREATE TRIGGER trigger_ensure_player_on_profile_insert
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.ensure_player_for_new_profile();
