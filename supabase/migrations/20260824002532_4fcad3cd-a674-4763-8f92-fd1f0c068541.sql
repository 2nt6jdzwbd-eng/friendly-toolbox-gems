CREATE TABLE public.platform_status (
  name text PRIMARY KEY,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_status TO anon, authenticated;
GRANT ALL ON public.platform_status TO service_role;

ALTER TABLE public.platform_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read platform status"
ON public.platform_status FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.platform_status (name, disabled) VALUES
  ('Ultrapari', false),
  ('1xBet', false),
  ('LineBet', false),
  ('WinWin', false),
  ('GreenBet', false);

CREATE OR REPLACE FUNCTION public.admin_set_platform_disabled(_pass text, _name text, _disabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.platform_status (name, disabled)
  VALUES (_name, _disabled)
  ON CONFLICT (name) DO UPDATE SET disabled = EXCLUDED.disabled, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_disabled(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT disabled FROM public.platform_status WHERE name = _name), false);
$$;