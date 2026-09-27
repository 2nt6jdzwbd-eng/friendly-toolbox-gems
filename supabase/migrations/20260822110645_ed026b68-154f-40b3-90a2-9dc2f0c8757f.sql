CREATE OR REPLACE FUNCTION public.submit_proof(_user_id text, _img1 text, _img2 text, _force boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id uuid; pending_count int; approved_count int; last_rejected timestamptz; secs int;
BEGIN
  IF NOT _force THEN
    SELECT count(*) INTO approved_count FROM public.submissions s
     WHERE s.user_id = btrim(_user_id) AND s.status = 'approved';
    IF approved_count > 0 THEN
      RETURN 'approved';
    END IF;

    SELECT count(*) INTO pending_count FROM public.submissions s
     WHERE s.user_id = btrim(_user_id) AND s.status = 'pending';
    IF pending_count > 0 THEN
      RETURN 'pending';
    END IF;

    SELECT s.created_at INTO last_rejected FROM public.submissions s
     WHERE s.user_id = btrim(_user_id) AND s.status = 'rejected'
     ORDER BY s.created_at DESC LIMIT 1;
    IF last_rejected IS NOT NULL AND last_rejected > now() - interval '1 hour' THEN
      secs := greatest(1, ceil(extract(epoch from (last_rejected + interval '1 hour' - now()))))::int;
      RETURN 'cooldown:' || secs::text;
    END IF;
  END IF;

  INSERT INTO public.submissions(user_id, image1_url, image2_url)
  VALUES (btrim(_user_id), _img1, _img2)
  RETURNING id INTO new_id;
  RETURN new_id::text;
END; $function$