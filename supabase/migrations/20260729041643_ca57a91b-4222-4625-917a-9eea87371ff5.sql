CREATE OR REPLACE FUNCTION app_private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private
AS $$
DECLARE
  v_type text;
BEGIN
  v_type := COALESCE((NEW.raw_user_meta_data->>'type')::text, 'customer');

  IF v_type NOT IN ('customer', 'provider') THEN
    v_type := 'customer';
  END IF;

  INSERT INTO public.profiles (user_id, type, display_name)
  VALUES (
    NEW.id,
    v_type,
    COALESCE(
      (NEW.raw_user_meta_data->>'display_name')::text,
      (NEW.raw_user_meta_data->>'full_name')::text,
      split_part(NEW.email, '@', 1)
    )
  );

  RETURN NEW;
END;
$$;
