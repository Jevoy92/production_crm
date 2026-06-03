DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'info@palmerhouseproduction.com';
  IF uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'info@palmerhouseproduction.com',
      crypt('SystemBlockOS26!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, '', '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('SystemBlockOS26!', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        recovery_token = '',
        updated_at = now()
    WHERE id = uid;
  END IF;
END $$;