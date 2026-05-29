UPDATE auth.users
SET encrypted_password = crypt('SystemBlockOS26!', gen_salt('bf')),
    updated_at = now(),
    recovery_token = '',
    recovery_sent_at = NULL
WHERE email = 'info@palmerhouseproduction.com';