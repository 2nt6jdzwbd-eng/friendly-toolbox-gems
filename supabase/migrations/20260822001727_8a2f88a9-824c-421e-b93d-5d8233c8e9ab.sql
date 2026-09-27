DROP FUNCTION IF EXISTS public.submit_proof(text, text, text);

CREATE OR REPLACE FUNCTION public.submit_proof(_user_id text, _img1 text, _img2 text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_id uuid; pending_count int; last_rejected timestamptz;
BEGIN
  SELECT count(*) INTO pending_count FROM public.submissions s
   WHERE s.user_id = btrim(_user_id) AND s.status = 'pending';
  IF pending_count > 0 THEN
    RETURN 'pending';
  END IF;

  SELECT s.created_at INTO last_rejected FROM public.submissions s
   WHERE s.user_id = btrim(_user_id) AND s.status = 'rejected'
   ORDER BY s.created_at DESC LIMIT 1;
  IF last_rejected IS NOT NULL AND last_rejected > now() - interval '1 hour' THEN
    RETURN 'cooldown';
  END IF;

  INSERT INTO public.submissions(user_id, image1_url, image2_url)
  VALUES (btrim(_user_id), _img1, _img2)
  RETURNING id INTO new_id;
  RETURN new_id::text;
END; $function$;

GRANT EXECUTE ON FUNCTION public.submit_proof(text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.telegram_id_for_user(_user_id text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE tid text;
BEGIN
  SELECT coalesce(s.telegram_id, c.telegram_id) INTO tid
  FROM public.submissions s
  LEFT JOIN LATERAL (
    SELECT a.telegram_id FROM public.activation_codes a
    WHERE a.user_id = s.user_id ORDER BY a.created_at DESC LIMIT 1
  ) c ON true
  WHERE s.user_id = btrim(_user_id)
  ORDER BY s.created_at DESC LIMIT 1;

  IF tid IS NULL THEN
    SELECT a.telegram_id INTO tid FROM public.activation_codes a
     WHERE a.user_id = btrim(_user_id) ORDER BY a.created_at DESC LIMIT 1;
  END IF;
  RETURN tid;
END; $function$;

REVOKE ALL ON FUNCTION public.telegram_id_for_user(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_id_for_user(text) TO service_role;