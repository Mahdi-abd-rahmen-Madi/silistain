-- Create a function that will be called with service role key
CREATE OR REPLACE FUNCTION public.handle_contact_form()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.contact_submissions (name, email, message, is_read)
  VALUES (NEW.name, NEW.email, NEW.message, false);
  RETURN NEW;
END;
$$;

-- Create a trigger function
CREATE OR REPLACE FUNCTION public.contact_form_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url := format('%s/functions/v1/handle-contact', current_setting('app.settings.supabase_url', true)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'name', NEW.name,
      'email', NEW.email,
      'message', NEW.message
    )
  );
  RETURN NEW;
END;
$$;

-- Create a trigger
CREATE TRIGGER on_contact_form_submit
AFTER INSERT ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.contact_form_trigger();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON FUNCTION public.handle_contact_form() TO anon;
GRANT ALL ON FUNCTION public.contact_form_trigger() TO anon;
