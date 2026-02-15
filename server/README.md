Lightweight email endpoint (Flask)
=================================

This small server accepts POST /send-message with JSON {name, email, subject, message}
and sends the message via SMTP. It is intended for local/dev use or behind a simple host.

Setup
-----

1. Create a virtualenv and install requirements:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment variables (example using Gmail SMTP):

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=465
export SMTP_USER=your@gmail.com
export SMTP_PASS="your-app-password-or-smtp-pass"
export SMTP_SSL=1
export FROM_EMAIL=your@gmail.com
export TO_EMAIL=pratikmaharjan323@gmail.com
```

Note: For Gmail you should create an App Password (if using 2FA) or enable "Less secure apps" (not recommended).

Run
---

```bash
python app.py
```

The endpoint will be available at `http://localhost:5000/send-message` and accepts JSON POST requests.

Security
--------
- Keep SMTP credentials secret (use environment variables or a secrets manager).
- In production, run behind HTTPS and use proper authentication/recaptcha to avoid abuse.
