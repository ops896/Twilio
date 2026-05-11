import twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sid } = req.query;

  if (!sid) {
    return res.status(400).json({ error: "Missing call SID" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  try {
    const client = twilio(accountSid, authToken);
    const call = await client.calls(sid).fetch();

    return res.status(200).json({
      sid: call.sid,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
    });
  } catch (err) {
    console.error("Twilio status error:", err);
    return res.status(500).json({ error: err.message });
  }
}
