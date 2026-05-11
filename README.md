# Twilio Dialer — Vercel App

A mobile-first outbound calling app built with Next.js and Twilio, deployable to Vercel in minutes.

## Features
- Numeric keypad + keyboard input
- US phone number formatting `(XXX) XXX-XXXX`
- Live call status polling
- End call button
- Dark, tactile UI

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Twilio credentials from [console.twilio.com](https://console.twilio.com):
- `TWILIO_ACCOUNT_SID` — Account SID (starts with `AC`)
- `TWILIO_AUTH_TOKEN` — Auth Token
- `TWILIO_PHONE_NUMBER` — Your purchased Twilio number (e.g. `+12125550100`)

### 3. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B — GitHub Import
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import repo
3. Add environment variables in **Settings → Environment Variables**:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
4. Deploy

---

## Project Structure

```
/
├── pages/
│   └── index.jsx          ← Dialer UI
├── api/
│   ├── call.js            ← POST /api/call — initiates outbound call
│   ├── call-status.js     ← GET  /api/call-status?sid=XXX — polls status
│   └── end-call.js        ← POST /api/end-call — hangs up
├── .env.example
└── package.json
```

---

## Notes

- **TwiML URL**: Twilio needs a public URL that returns call instructions. The default uses Twilio's demo URL. For production, create your own `/api/twiml` endpoint returning XML like:
  ```xml
  <Response><Say>Hello from your dialer!</Say></Response>
  ```
- **Twilio trial accounts** can only call verified numbers. Upgrade to a paid account for unrestricted calling.
