Reset the password for the shared team account `info@palmerhouseproduction.com` to `SystemBlockOS26!`.

## Steps

1. Run an admin update against `auth.users` to set the encrypted password for `info@palmerhouseproduction.com` to a bcrypt hash of `SystemBlockOS26!` (using `crypt()` with `gen_salt('bf')`), and clear any existing recovery tokens.
2. Verify by checking `updated_at` on the user row.
3. Confirm to you that the team can now sign in with:
   - Email: `info@palmerhouseproduction.com`
   - Password: `SystemBlockOS26!`

## Notes

- No app code, schema, or RLS changes — this is a one-shot data update to the auth table.
- After this, anyone with these credentials can sign in on any device and see the synced Checklists / Overview data.
- Recommend rotating the password later if it's ever shared outside the team.