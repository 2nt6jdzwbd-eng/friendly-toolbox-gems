CREATE OR REPLACE FUNCTION public.submit_proof(_user_id text, _img1 text, _img2 text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid; pending_count int;
BEGIN
  SELECT count(*) INTO pending_count FROM public.submissions s
   WHERE s.user_id = btrim(_user_id) AND s.status = 'pending';
  IF pending_count > 0 THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.submissions(user_id, image1_url, image2_url)
  VALUES (btrim(_user_id), _img1, _img2)
  RETURNING id INTO new_id;
  RETURN new_id;
END; $$;