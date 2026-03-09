ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players are readable by everyone" ON public.players;
CREATE POLICY "Players are readable by everyone"
ON public.players
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can update own or unlinked player row" ON public.players;
CREATE POLICY "Users can update own or unlinked player row"
ON public.players
FOR UPDATE
TO authenticated
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
