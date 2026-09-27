CREATE TABLE public.activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  telegram_id TEXT,
  user_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activation_codes_code_idx ON public.activation_codes (code);
GRANT ALL ON public.activation_codes TO service_role;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.activation_codes ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  telegram_id text,
  image1_url text NOT NULL,
  image2_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS submissions_user_idx ON public.submissions(user_id);

CREATE TABLE IF NOT EXISTS public.pending_starts (
  telegram_id text PRIMARY KEY,
  user_id text,
  first_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pending_starts TO service_role;
ALTER TABLE public.pending_starts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.submit_proof(_user_id text, _img1 text, _img2 text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.submissions(user_id, image1_url, image2_url)
  VALUES (btrim(_user_id), _img1, _img2)
  RETURNING id INTO new_id;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.verify_activation_code(_code text)
RETURNS TABLE(status text, user_id text, expires_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.activation_codes%ROWTYPE; s public.submissions%ROWTYPE; new_exp timestamptz;
BEGIN
  SELECT * INTO r FROM public.activation_codes c WHERE c.code = upper(btrim(_code)) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text, ''::text, NULL::timestamptz; RETURN;
  END IF;

  SELECT * INTO s FROM public.submissions x
   WHERE x.user_id = coalesce(r.user_id,'') ORDER BY x.created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'pending'::text, coalesce(r.user_id,''), NULL::timestamptz; RETURN;
  ELSIF s.status = 'rejected' THEN
    RETURN QUERY SELECT 'rejected'::text, coalesce(r.user_id,''), NULL::timestamptz; RETURN;
  ELSIF s.status <> 'approved' THEN
    RETURN QUERY SELECT 'pending'::text, coalesce(r.user_id,''), NULL::timestamptz; RETURN;
  END IF;

  IF r.used_at IS NULL THEN
    new_exp := now() + make_interval(mins => r.duration_minutes);
    UPDATE public.activation_codes SET used_at = now(), expires_at = new_exp WHERE id = r.id;
    RETURN QUERY SELECT 'ok'::text, coalesce(r.user_id,''), new_exp; RETURN;
  ELSIF r.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::text, coalesce(r.user_id,''), r.expires_at; RETURN;
  END IF;

  RETURN QUERY SELECT 'ok'::text, coalesce(r.user_id,''), r.expires_at;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_submission_status(_pass text, _id uuid, _status text)
RETURNS TABLE(telegram_id text) LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('approved','rejected','pending') THEN RAISE EXCEPTION 'bad status'; END IF;
  RETURN QUERY UPDATE public.submissions s SET status = _status WHERE s.id = _id RETURNING s.telegram_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_submission(_pass text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.submissions s WHERE s.id = _id;
END; $function$;

CREATE OR REPLACE FUNCTION public.request_status(_user_id text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE st text;
BEGIN
  SELECT s.status INTO st FROM public.submissions s
   WHERE s.user_id = btrim(_user_id) ORDER BY s.created_at DESC LIMIT 1;
  RETURN coalesce(st, 'none');
END; $function$;

CREATE OR REPLACE FUNCTION public.telegram_fulfill_request(_user_id text, _telegram_id text, _code text, _duration_minutes integer)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF btrim(coalesce(_user_id, '')) = '' OR btrim(coalesce(_telegram_id, '')) = '' OR btrim(coalesce(_code, '')) = '' THEN
    RAISE EXCEPTION 'missing required value';
  END IF;

  INSERT INTO public.activation_codes(code, telegram_id, user_id, duration_minutes, expires_at)
  VALUES (upper(btrim(_code)), btrim(_telegram_id), btrim(_user_id), greatest(1, least(_duration_minutes, 1440)), now() + interval '365 days');

  UPDATE public.submissions
  SET telegram_id = btrim(_telegram_id)
  WHERE user_id = btrim(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.telegram_save_pending(_telegram_id text, _user_id text, _first_name text)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pending_starts(telegram_id, user_id, first_name)
  VALUES (btrim(_telegram_id), nullif(btrim(coalesce(_user_id, '')), ''), nullif(btrim(coalesce(_first_name, '')), ''))
  ON CONFLICT (telegram_id) DO UPDATE
  SET user_id = excluded.user_id, first_name = excluded.first_name, created_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.telegram_take_pending(_telegram_id text)
RETURNS TABLE(user_id text, first_name text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH taken AS (
    DELETE FROM public.pending_starts p
    WHERE p.telegram_id = btrim(_telegram_id)
    RETURNING p.user_id, p.first_name
  )
  SELECT taken.user_id, taken.first_name FROM taken LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notification_payload(_pass text, _submission_id uuid, _user_id text)
RETURNS TABLE(telegram_id text, code text, duration_minutes integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN QUERY
  SELECT coalesce(s.telegram_id, c.telegram_id), c.code, c.duration_minutes
  FROM public.submissions s
  LEFT JOIN LATERAL (
    SELECT a.telegram_id, a.code, a.duration_minutes
    FROM public.activation_codes a
    WHERE a.user_id = s.user_id
    ORDER BY a.created_at DESC
    LIMIT 1
  ) c ON true
  WHERE s.id = _submission_id AND s.user_id = btrim(_user_id)
  LIMIT 1;
END;
$$;

CREATE FUNCTION public.admin_list_submissions(_pass text)
RETURNS TABLE(id uuid, user_id text, telegram_id text, image1_url text, image2_url text, status text, created_at timestamptz, activation_code text, duration_minutes integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT s.id, s.user_id, coalesce(s.telegram_id, c.telegram_id), s.image1_url, s.image2_url, s.status, s.created_at, c.code, c.duration_minutes
  FROM public.submissions s
  LEFT JOIN LATERAL (
    SELECT a.telegram_id, a.code, a.duration_minutes
    FROM public.activation_codes a
    WHERE a.user_id = s.user_id
    ORDER BY a.created_at DESC
    LIMIT 1
  ) c ON true
  ORDER BY s.created_at DESC
  LIMIT 200;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_activation_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_proof(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_submission_status(text, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_submission(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_status(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.telegram_fulfill_request(text, text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.telegram_save_pending(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.telegram_take_pending(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_notification_payload(text, uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_submissions(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "proofs read" ON storage.objects;
CREATE POLICY "proofs read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'proofs');
DROP POLICY IF EXISTS "proofs upload" ON storage.objects;
CREATE POLICY "proofs upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'proofs');