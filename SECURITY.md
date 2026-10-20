# Security notes

## Supabase

- The browser uses only the Supabase publishable key. Never put a `service_role` or secret key in a `VITE_*` variable, GitHub Pages build, or client-side code; Vite embeds `VITE_*` values in public files.
- Public menu reads are limited to available rows and the `id`, `name`, `available`, and `position` columns. Orders have RLS enabled and are not directly readable by `anon`.
- Table access uses the requested policy: any authenticated Supabase user can manage menu and order records; anonymous users cannot directly read orders. This means every Supabase account with a valid session has those privileges.
- Guest writes go through typed RPC parameters, not SQL string construction. The RPC validates the name, date, device, and menu and serializes writes per device to reject duplicate active orders. RLS policies and grants remain necessary; a browser-side check is never an authorization boundary.

## Limits of static hosting

GitHub Pages cannot keep server secrets or reliably rate-limit hostile clients. The publishable key and staff email are public by design. Database policies protect stored data from anonymous direct access, but allowing all authenticated users to manage menu/orders intentionally grants a broad role. Preventing automated public order spam needs a server-side Edge Function or another trusted rate limiter (and optionally a CAPTCHA); never solve that by exposing a service-role key.

## Reporting

Do not put credentials, access tokens, or real customer data in public issues. Rotate any secret that has been committed or exposed.
