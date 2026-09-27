CREATE TABLE public.game_rates (
  name text PRIMARY KEY,
  rate integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.game_rates TO anon;
GRANT SELECT ON public.game_rates TO authenticated;
GRANT ALL ON public.game_rates TO service_role;

ALTER TABLE public.game_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read game rates"
ON public.game_rates FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.game_rates (name, rate) VALUES
  ('Apple of fortune', 94),
  ('Crash', 97),
  ('Gems Mines', 92),
  ('Thimbles', 90),
  ('Wild West', 95);

CREATE OR REPLACE FUNCTION public.admin_set_game_rate(_pass text, _name text, _rate integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.game_rates (name, rate)
  VALUES (btrim(_name), greatest(1, least(_rate, 100)))
  ON CONFLICT (name) DO UPDATE SET rate = EXCLUDED.rate, updated_at = now();
END; $function$;