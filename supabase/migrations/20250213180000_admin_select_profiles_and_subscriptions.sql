-- Allow admins to select all profiles (in addition to "select own")
CREATE POLICY "Allow admins to select all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- Allow admins to select all subscriptions (no SELECT policy existed)
CREATE POLICY "Allow admins to select subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (is_admin());
