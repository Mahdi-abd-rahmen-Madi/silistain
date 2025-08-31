-- Drop existing trigger and functions if they exist
DROP TRIGGER IF EXISTS on_contact_form_submit ON public.contact_submissions;
DROP FUNCTION IF EXISTS public.contact_form_trigger();
DROP FUNCTION IF EXISTS public.handle_contact_form();

-- Create a simple function to insert contact form data
CREATE OR REPLACE FUNCTION public.submit_contact(
  p_name TEXT,
  p_email TEXT,
  p_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.contact_submissions (name, email, message, is_read)
  VALUES (p_name, p_email, p_message, false)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.submit_contact(TEXT, TEXT, TEXT) TO anon;
