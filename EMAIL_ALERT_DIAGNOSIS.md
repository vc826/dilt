# AGlobalBank email alert investigation

## Scope and safety

This branch is for review only. It is not the Render production branch and must not be deployed automatically. No production files, Supabase settings, DNS records, or environment variables were changed during this investigation.

## Findings from the deployed build

- The repository currently contains the compiled `dist/` output, not the original application source code.
- The compiled frontend initializes Supabase using a project URL hardcoded in `dist/assets/index-DjtszcDd.js`. That URL points to a different project than the current Supabase project configured for the email function.
- The frontend already contains a helper that invokes the function named `send-email-alert` with `to`, `subject`, and `message`.
- That helper catches and suppresses invocation errors, so the website can fail to send an alert without showing the failure.
- The deployed Edge Function uses `withSupabase({ auth: "user" })`, which requires a Supabase user JWT. The website's compiled login flow uses a custom customer record/local-storage session, not a Supabase Auth user session. A publishable/anon API key alone cannot satisfy this requirement.
- The current Supabase project has no application tables, so it is not safe to point the compiled site at it as a simple URL replacement.

## Why no production code was patched

Changing only the compiled bundle's Supabase URL could break the website's existing customer, account, and transaction features because the current Supabase project does not contain the tables the frontend expects. Disabling Edge Function authentication would expose an email-sending endpoint to abuse. Neither is an acceptable quick fix.

## Safe path to complete the integration

1. Recover the original application source project (or obtain the correct source repository and its matching Supabase project).
2. Confirm which Supabase project owns the live website data and its required tables.
3. Implement email sending server-side. The browser must not receive the Resend API key or any service-role secret.
4. Authorize customer-specific alerts using trusted server-side identity and data; authorize broadcasts only for verified administrators.
5. Return and log email errors instead of silently swallowing them in the frontend.
6. Test in a non-production environment, then review a pull request before any production deployment.

## Current status

Email alert integration is not complete. This branch records the verified blockers and preserves the production `main` branch unchanged.
