import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "luffu001@gmail.com"
SMTP_PASSWORD = "hvrl kxir nsof ldki"
FROM_EMAIL = "no-reply@example.com"
FROM_NAME = "CartStream Support"

# def send_reset_email(to_email: str, reset_link: str):
#     subject = "Password Reset Request"
#     body = f"""Hi,

# You requested a password reset. Please click the link below to reset your password. This link is valid for 15 minutes.

# {reset_link}

# If you did not request this, please ignore this email.

# Thanks,
# CartStream Support
# """

#     msg = MIMEMultipart()
#     msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
#     msg['To'] = to_email
#     msg['Subject'] = subject
#     msg.attach(MIMEText(body, 'plain'))

#     with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
#         server.starttls()
#         server.login(SMTP_USERNAME, SMTP_PASSWORD)
#         server.sendmail(FROM_EMAIL, to_email, msg.as_string())

# =====================
# Generic Email Sender
# =====================
def send_email(subject: str, body: str, to_email: str):
    """
    Sends a plain text email using the configured SMTP server.
    """
    msg = MIMEMultipart()
    msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())

# =====================
# Password Reset Email
# =====================
def send_reset_email(to_email: str, reset_link: str):
    """
    Sends password reset email to the given recipient.
    """
    subject = "Password Reset Request"
    body = f"""Hi,

You requested a password reset. Please click the link below to reset your password.
This link is valid for 15 minutes.

{reset_link}

If you did not request this, please ignore this email.

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email)

# =====================
# Low Stock Email
# =====================
def send_low_stock_email(to_email: str, item_title: str, stock: int):
    """
    Sends a low stock alert to the shop owner/admin.
    """
    subject = f"Low Stock Alert: {item_title}"
    body = f"""Hi,

This is a low stock alert for your product:

Item: {item_title}
Current Stock: {stock}

Please restock soon to avoid losing potential sales.

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email) 