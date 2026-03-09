DROP POLICY IF EXISTS "Users can insert own player row" ON public.players;
CREATE POLICY "Users can insert own player row"
ON public.players
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own player row" ON public.players;
CREATE POLICY "Users can delete own player row"
ON public.players
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
