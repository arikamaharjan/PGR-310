import os
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify

app = Flask(__name__)

def send_email_smtp(to_addr: str, subject: str, body: str, from_addr: str, smtp_cfg: dict):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_addr
    msg.set_content(body)

    host = smtp_cfg.get('HOST')
    port = int(smtp_cfg.get('PORT', 0))
    user = smtp_cfg.get('USER')
    password = smtp_cfg.get('PASS')
    use_ssl = smtp_cfg.get('SSL', '1') in ('1', 'true', 'True')

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=10) as s:
            if user and password:
                s.login(user, password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=10) as s:
            s.ehlo()
            if smtp_cfg.get('STARTTLS', '1') in ('1', 'true', 'True'):
                s.starttls()
                s.ehlo()
            if user and password:
                s.login(user, password)
            s.send_message(msg)


@app.route('/send-message', methods=['POST'])
def send_message():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip() or f'Portfolio message from {name or email}'
    message = data.get('message', '').strip()

    if not message or not email:
        return jsonify({'error': 'email and message required'}), 400

    to_addr = os.environ.get('TO_EMAIL', os.environ.get('SMTP_TO', 'pratikmaharjan323@gmail.com'))
    from_addr = os.environ.get('FROM_EMAIL', os.environ.get('SMTP_FROM', to_addr))

    smtp_cfg = {
        'HOST': os.environ.get('SMTP_HOST', 'smtp.gmail.com'),
        'PORT': os.environ.get('SMTP_PORT', '465'),
        'USER': os.environ.get('SMTP_USER', ''),
        'PASS': os.environ.get('SMTP_PASS', ''),
        'SSL': os.environ.get('SMTP_SSL', '1'),
        'STARTTLS': os.environ.get('SMTP_STARTTLS', '1'),
    }

    full_body = f'Name: {name}\nEmail: {email}\n\n{message}'

    try:
        send_email_smtp(to_addr, subject, full_body, from_addr, smtp_cfg)
        return jsonify({'ok': True}), 200
    except Exception as e:
        app.logger.exception('send_message failed')
        return jsonify({'error': 'failed to send', 'detail': str(e)}), 500


if __name__ == '__main__':
    # For local development. In production use a WSGI server.
    port = int(os.environ.get('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=False)
