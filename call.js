import twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to } = req.body;

  // Validate US number
  if (!to || !/^\+1[2-9]\d{9}$/.test(to)) {
    return res.status(400).json({ error: "Invalid US phone number" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const twimlUrl = process.env.TWIML_URL || "https://demo.twilio.com/welcome/voice/";

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: "Twilio credentials not configured" });
  }

  try {
    const client = twilio(accountSid, authToken);
    const call = await client.calls.create({
      to,
      from: fromNumber,
      url: twimlUrl,
    });

    return res.status(200).json({
      sid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (err) {
    console.error("Twilio error:", err);
    return res.status(500).json({ error: err.message });
  }
}
