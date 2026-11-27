// Supabase Edge Function: send branded customer email alerts via Resend.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY is not configured" }, 500);
    if (!FROM_EMAIL || !/^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/.test(FROM_EMAIL)) {
      return json({ error: "FROM_EMAIL must be set to an address on a verified sending domain" }, 500);
    }

    let payload: { to?: unknown; subject?: unknown; message?: unknown };
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Request body must be valid JSON" }, 400);
    }

    const to = typeof payload.to === "string" ? payload.to.trim() : "";
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return json({ error: "A valid recipient email address is required" }, 400);
    }
    if (!subject || !message) return json({ error: "Subject and message are required" }, 400);
    if (subject.length > 200 || message.length > 10000) {
      return json({ error: "Subject or message exceeds the allowed length" }, 400);
    }

    const bankName = "Alliance Global Bank";
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0c14;color:#e5e7eb;border-radius:16px;overflow:hidden;border:1px solid #1a1f2e">
        <div style="background:linear-gradient(135deg,#d4a843,#b8860b);padding:28px 32px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:#d4a843;background:#0a0c14;border-radius:12px;padding:10px;display:inline-block">A</div>
          <h1 style="color:#0a0c14;margin:12px 0 0;font-size:22px">${bankName}</h1>
          <p style="color:#30240a;margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase">Private Banking, Redefined</p>
        </div>
        <div style="padding:36px 32px">
          <h2 style="color:#d4a843;margin:0 0 16px;font-size:18px">${safeSubject}</h2>
          <p style="color:#cbd5e1;line-height:1.7;font-size:15px;margin:0 0 20px">${safeMessage}</p>
          <div style="background:#11151f;border-radius:12px;padding:16px 20px;border:1px solid #1a1f2e">
            <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6"><strong>Need help?</strong> Please contact the support team using the contact details published on our official website.</p>
          </div>
          <hr style="border:0;border-top:1px solid #1a1f2e;margin:28px 0 20px">
          <p style="text-align:center;color:#6b7280;font-size:12px">This is an automated message from ${bankName}. Please do not reply.</p>
        </div>
      </div>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${bankName} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const responseText = await resendResponse.text();
    let resendData: { id?: string; message?: string } = {};
    try { resendData = JSON.parse(responseText); } catch { /* retain raw provider error below */ }

    if (!resendResponse.ok) {
      console.error("Resend rejected email:", resendResponse.status, responseText);
      return json({
        error: "Email provider rejected the message",
        detail: resendData.message ?? responseText,
      }, 502);
    }

    return json({ success: true, id: resendData.id });
  } catch (error) {
    console.error("send-email-alert failed:", error);
    return json({ error: "Internal email service error" }, 500);
  }
});
