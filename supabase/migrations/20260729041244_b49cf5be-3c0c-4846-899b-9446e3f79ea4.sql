CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app_private, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO service_role;

CREATE OR REPLACE FUNCTION app_private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, type)
    VALUES (NEW.id, 'customer');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION app_private.handle_new_user();

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.handle_new_user();

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT USAGE ON SCHEMA app_private TO service_role;