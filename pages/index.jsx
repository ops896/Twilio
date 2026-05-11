import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const KEYS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidUS(raw) {
  return raw.replace(/\D/g, "").length === 10;
}

const STATUS_LABELS = {
  idle: "Ready to call",
  connecting: "Connecting…",
  queued: "Queued",
  ringing: "Ringing…",
  "in-progress": "In Call",
  completed: "Call Ended",
  failed: "Call Failed",
  busy: "Line Busy",
  "no-answer": "No Answer",
};

const STATUS_COLORS = {
  idle: "#666",
  connecting: "#f0c040",
  queued: "#f0c040",
  ringing: "#4db8ff",
  "in-progress": "#39e87c",
  completed: "#aaa",
  failed: "#ff4d4d",
  busy: "#ff9966",
  "no-answer": "#ff9966",
};

export default function Dialer() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [callSid, setCallSid] = useState(null);
  const [error, setError] = useState(null);
  const [pressing, setPressing] = useState(null);

  const inCall = status === "in-progress" || status === "ringing" || status === "connecting" || status === "queued";

  const pressKey = useCallback((digit) => {
    if (inCall) return;
    setInput((prev) => {
      const digits = prev.replace(/\D/g, "");
      if (digits.length >= 10 && digit !== "*" && digit !== "#") return prev;
      return prev + digit;
    });
  }, [inCall]);

  const backspace = () => {
    if (inCall) return;
    setInput((prev) => prev.slice(0, -1));
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Backspace") { backspace(); return; }
      if (e.key === "Enter" && isValidUS(input) && !inCall) { initiateCall(); return; }
      const k = KEYS.find((k) => k.digit === e.key);
      if (k) pressKey(k.digit);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input, inCall, pressKey]);

  // Poll call status
  useEffect(() => {
    if (!callSid || !inCall) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call-status?sid=${callSid}`);
        const data = await res.json();
        if (data.status) setStatus(data.status);
        if (["completed", "failed", "busy", "no-answer"].includes(data.status)) {
          clearInterval(interval);
        }
      } catch (_) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [callSid, inCall]);

  const initiateCall = async () => {
    if (!isValidUS(input) || inCall) return;
    setStatus("connecting");
    setError(null);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "+1" + input.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Call failed");
      setCallSid(data.sid);
      setStatus(data.status || "queued");
    } catch (err) {
      setStatus("failed");
      setError(err.message);
    }
  };

  const endCall = async () => {
    if (!callSid) { setStatus("idle"); return; }
    try {
      await fetch("/api/end-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid: callSid }),
      });
    } catch (_) {}
    setStatus("idle");
    setCallSid(null);
  };

  const resetAll = () => {
    setInput("");
    setStatus("idle");
    setCallSid(null);
    setError(null);
  };

  const statusColor = STATUS_COLORS[status] || "#666";
  const displayValue = formatPhone(input.replace(/[^0-9*#]/g, "")) || "";

  return (
    <>
      <Head>
        <title>Dial</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="shell">
        <div className="phone">
          {/* Header */}
          <div className="header">
            <span className="carrier">DIAL</span>
            <div className="status-pill" style={{ color: statusColor, borderColor: statusColor }}>
              <span className="status-dot" style={{ background: statusColor }} />
              {STATUS_LABELS[status] || status}
            </div>
          </div>

          {/* Display */}
          <div className="display">
            <div className="number">
              {displayValue || <span className="placeholder">Enter number</span>}
            </div>
            {error && <div className="error-msg">{error}</div>}
          </div>

          {/* Keypad */}
          <div className="keypad">
            {KEYS.map(({ digit, sub }) => (
              <button
                key={digit}
                className={`key ${pressing === digit ? "pressed" : ""}`}
                onPointerDown={() => { setPressing(digit); pressKey(digit); }}
                onPointerUp={() => setPressing(null)}
                onPointerLeave={() => setPressing(null)}
                disabled={inCall}
              >
                <span className="key-digit">{digit}</span>
                {sub && <span className="key-sub">{sub}</span>}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="actions">
            <button
              className="btn-ghost"
              onClick={backspace}
              disabled={inCall || !input}
              aria-label="Backspace"
            >
              ⌫
            </button>

            {!inCall ? (
              <button
                className="btn-call"
                onClick={initiateCall}
                disabled={!isValidUS(input)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="currentColor"/>
                </svg>
              </button>
            ) : (
              <button className="btn-end" onClick={endCall}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17.4 13.2c-1.4-2.8-3.8-5.1-6.6-6.6L8.6 8.8c-.3.3-.7.4-1 .2C6.5 8.6 5.3 8.4 4 8.4c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1C13.4 3 21 10.6 21 20c0 .6-.4 1-1 1h-3.5c-.6 0-1-.4-1-1 0-1.3-.2-2.5-.6-3.6-.1-.3 0-.7.2-1l2.3-2.2z" fill="currentColor" transform="rotate(135 12 12)"/>
                </svg>
              </button>
            )}

            <button
              className="btn-ghost"
              onClick={resetAll}
              disabled={inCall}
              aria-label="Clear"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #080808;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Rajdhani', sans-serif;
        }
      `}</style>

      <style jsx>{`
        .shell {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          background: radial-gradient(ellipse at 50% 60%, #0d1a0f 0%, #080808 70%);
        }

        .phone {
          width: 100%;
          max-width: 360px;
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 36px;
          padding: 32px 28px 40px;
          box-shadow:
            0 0 0 1px #000,
            0 40px 80px rgba(0,0,0,.8),
            inset 0 1px 0 rgba(255,255,255,.04);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .carrier {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 4px;
          color: #333;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          border: 1px solid;
          border-radius: 20px;
          padding: 3px 10px;
          transition: color .4s, border-color .4s;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: background .4s;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }

        .display {
          min-height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid #181818;
        }

        .number {
          font-family: 'Share Tech Mono', monospace;
          font-size: 34px;
          color: #e8e8e8;
          letter-spacing: 2px;
          text-align: center;
        }

        .placeholder {
          font-size: 16px;
          color: #2a2a2a;
          letter-spacing: 1px;
        }

        .error-msg {
          margin-top: 8px;
          font-size: 12px;
          color: #ff4d4d;
          text-align: center;
        }

        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 24px 0 20px;
        }

        .key {
          background: #161616;
          border: 1px solid #222;
          border-radius: 16px;
          padding: 14px 0 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: background .1s, transform .1s, border-color .15s;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .key:hover:not(:disabled) {
          background: #1e1e1e;
          border-color: #2e2e2e;
        }

        .key.pressed, .key:active:not(:disabled) {
          background: #1a2e1c;
          border-color: #39e87c44;
          transform: scale(.95);
        }

        .key:disabled {
          opacity: .3;
          cursor: not-allowed;
        }

        .key-digit {
          font-family: 'Rajdhani', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #ddd;
          line-height: 1;
        }

        .key-sub {
          font-family: 'Rajdhani', sans-serif;
          font-size: 9px;
          letter-spacing: 2px;
          color: #444;
          margin-top: 3px;
        }

        .actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          margin-top: 8px;
        }

        .btn-ghost {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid #222;
          color: #555;
          font-size: 18px;
          cursor: pointer;
          transition: color .2s, border-color .2s, background .2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-ghost:hover:not(:disabled) {
          color: #aaa;
          border-color: #444;
          background: #151515;
        }

        .btn-ghost:disabled {
          opacity: .2;
          cursor: not-allowed;
        }

        .btn-call {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #39e87c;
          border: none;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(57,232,124,.3), 0 8px 24px rgba(0,0,0,.4);
          transition: transform .15s, box-shadow .15s, background .15s;
        }

        .btn-call:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 0 32px rgba(57,232,124,.5), 0 8px 32px rgba(0,0,0,.5);
        }

        .btn-call:active:not(:disabled) {
          transform: scale(.96);
        }

        .btn-call:disabled {
          background: #1a2e1c;
          color: #2a4a2e;
          box-shadow: none;
          cursor: not-allowed;
        }

        .btn-end {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #e83939;
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(232,57,57,.3), 0 8px 24px rgba(0,0,0,.4);
          transition: transform .15s, box-shadow .15s;
          animation: ring-pulse 1.5s infinite;
        }

        .btn-end:hover {
          transform: scale(1.06);
          box-shadow: 0 0 32px rgba(232,57,57,.5), 0 8px 32px rgba(0,0,0,.5);
        }

        @keyframes ring-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(232,57,57,.3), 0 8px 24px rgba(0,0,0,.4); }
          50% { box-shadow: 0 0 40px rgba(232,57,57,.6), 0 8px 24px rgba(0,0,0,.4); }
        }
      `}</style>
    </>
  );
}
