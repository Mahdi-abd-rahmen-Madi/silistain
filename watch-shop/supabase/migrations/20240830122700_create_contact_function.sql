-- Create a function to handle contact form submissions
CREATE OR REPLACE FUNCTION public.submit_contact_form(
  p_name TEXT,
  p_email TEXT,
  p_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Insert the contact form submission
  INSERT INTO public.contact_submissions (name, email, message, is_read)
  VALUES (p_name, p_email, p_message, false)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.submit_contact_form(TEXT, TEXT, TEXT) TO anon;
