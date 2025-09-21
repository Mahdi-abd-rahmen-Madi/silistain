-- Enable RLS on the coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own coupons
CREATE POLICY "Enable insert for authenticated users" ON public.coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id::uuid);

-- Allow users to read their own coupons
CREATE POLICY "Enable read access for users based on user_id" ON public.coupons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id::uuid);

-- Allow users to update their own coupons
CREATE POLICY "Enable update for users based on user_id" ON public.coupons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id::uuid);

-- Allow users to delete their own coupons
CREATE POLICY "Enable delete for users based on user_id" ON public.coupons
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id::uuid);
