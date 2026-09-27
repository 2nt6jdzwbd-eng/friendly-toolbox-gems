ALTER TABLE public.platform_status
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS register_url text,
  ADD COLUMN IF NOT EXISTS deposit_usd numeric,
  ADD COLUMN IF NOT EXISTS deposit_egp numeric,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

UPDATE public.platform_status SET register_url='https://refpa42156.com/L?tag=d_5991719m_118431c_apk&site=5991719&ad=118431', deposit_egp=150, deposit_usd=4, sort_order=1 WHERE name='Ultrapari';
UPDATE public.platform_status SET register_url='https://reffpa.com/L?tag=d_2845435m_27409c_&site=2845435&ad=27409', deposit_egp=300, deposit_usd=6, sort_order=2 WHERE name='1xBet';
UPDATE public.platform_status SET register_url='https://lb-aff.com/L?tag=d_6015821m_66803c_apk1&site=6015821&ad=66803', deposit_egp=300, deposit_usd=6, sort_order=3 WHERE name='LineBet';
UPDATE public.platform_status SET register_url='https://refpa49781.com/L?tag=d_5981657m_68383c_&site=5981657&ad=68383', deposit_egp=200, deposit_usd=5, sort_order=4 WHERE name='WinWin';
DELETE FROM public.platform_status WHERE name='GreenBet';

CREATE OR REPLACE FUNCTION public.admin_upsert_platform(_pass text, _old_name text, _name text, _logo_url text, _register_url text, _deposit_usd numeric, _deposit_egp numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF btrim(coalesce(_name,'')) = '' THEN RAISE EXCEPTION 'name required'; END IF;
  IF coalesce(_old_name,'') <> '' AND EXISTS (SELECT 1 FROM public.platform_status WHERE name = _old_name) THEN
    UPDATE public.platform_status SET name = btrim(_name), logo_url = coalesce(_logo_url, logo_url),
      register_url = _register_url, deposit_usd = _deposit_usd, deposit_egp = _deposit_egp, updated_at = now()
    WHERE name = _old_name;
  ELSE
    INSERT INTO public.platform_status(name, logo_url, register_url, deposit_usd, deposit_egp, sort_order)
    VALUES (btrim(_name), _logo_url, _register_url, _deposit_usd, _deposit_egp,
      coalesce((SELECT max(sort_order) FROM public.platform_status), 0) + 1);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_platform(_pass text, _name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF upper(btrim(_pass)) <> 'HACKSD' THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.platform_status WHERE name = _name;
END; $$;