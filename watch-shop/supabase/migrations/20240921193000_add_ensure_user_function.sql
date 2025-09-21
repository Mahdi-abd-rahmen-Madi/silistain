-- Function to ensure a user exists in the users table
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) AND NEW.user_id IS NOT NULL THEN
    -- Insert the user with just the ID and email (other fields can be updated later)
    INSERT INTO public.users (id, email)
    VALUES (NEW.user_id, (SELECT email FROM auth.users WHERE id = NEW.user_id LIMIT 1)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to ensure user exists before insert on orders
CREATE OR REPLACE TRIGGER ensure_user_exists_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_exists();

-- Update the RLS policy to allow inserting orders
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.orders;
CREATE POLICY "Allow insert for authenticated users"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow the trigger to be executed by authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;
