# Email alert deployment

The `send-email-alert` Supabase Edge Function has been repaired to use `Deno.serve`, validate its request, escape user-provided HTML, and return Resend provider errors. The frontend now logs invocation failures instead of silently swallowing them.

## Important: verify the target project before deploying

The `.env` included with the uploaded source archive points to Supabase project reference `xhsotokflbopdorvwlfh`. The project reference previously entered in the CLI was `glwqestoziovwtvhiryc`, which does not match. **Do not deploy until you verify which project your live Render app actually uses.** Check Render → your service → Environment for `VITE_SUPABASE_URL` (or the corresponding Supabase URL variable), and use the project reference in that URL. If Render's value differs from the uploaded `.env`, use Render's live value.

## Required Supabase secrets

Set these on the verified target Supabase project:

- `RESEND_API_KEY`: your Resend API key.
- `FROM_EMAIL`: an email address on a domain verified in Resend.

Do not put `RESEND_API_KEY` in a `VITE_*` variable or frontend code.

## Deploy from the project root

Open PowerShell in the extracted project folder (the folder containing `package.json` and the `supabase` folder), then run:

```powershell
npx.cmd supabase link --project-ref YOUR_VERIFIED_PROJECT_REF
npx.cmd supabase secrets set RESEND_API_KEY=YOUR_RESEND_KEY FROM_EMAIL=alerts@your-verified-domain.com
npx.cmd supabase functions deploy send-email-alert
```

Replace the example values. Keep the Resend key private.

## Verify

Trigger an email alert from the live app and inspect Supabase Dashboard → Edge Functions → `send-email-alert` → Logs. A successful response should include `success: true` and a Resend message ID. Delivery testing requires a valid Resend API key and a verified sender domain.
