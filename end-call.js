import twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sid } = req.body;

  if (!sid) {
    return res.status(400).json({ error: "Missing call SID" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  try {
    const client = twilio(accountSid, authToken);
    const call = await client.calls(sid).update({ status: "completed" });

    return res.status(200).json({ sid: call.sid, status: call.status });
  } catch (err) {
    console.error("Twilio end-call error:", err);
    return res.status(500).json({ error: err.message });
  }
}
