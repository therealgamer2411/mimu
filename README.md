# MIMU — Mobile Medical Assistant (Demo)

Live demo: https://<your-user>.github.io/<repo>/  ← replace with your Pages URL

## Quick start (phone)
1. Open the demo URL on your phone (HTTPS).
2. Settings → fill profile (name, age, emergency contact).
3. Paste your Make / EasyConnect webhook URL in Settings → Webhook.
4. Enroll owner voice (3–4 samples, same sentence).
5. Start monitoring → test a loud owner sound → wait 10s (auto-cancel) or confirm.

## Notes
- Proof-of-Concept only (not a medical device).
- All raw audio processing is local on the device; no raw audio is uploaded by default.
- Do not commit secrets (webhook tokens, phone numbers) to this repository.

## Files
- `index.html` — single-file demo (UI + logic)
- `assets/` — images, SVGs
- `docs/` — demo script and Make/EasyConnect instructions

License: MIT
