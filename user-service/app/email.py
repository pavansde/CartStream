import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "luffu001@gmail.com"
SMTP_PASSWORD = "hvrl kxir nsof ldki"
FROM_EMAIL = "luffu001@gmail.com"
FROM_NAME = "CartStream Support"

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

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        logging.info(f"Verification email sent to {to_email}")
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {e}")
        raise

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


# =====================
# Verification Email
# =====================
def send_verification_email(to_email: str, verification_link: str):
    """
    Sends verification email to the given recipient.
    """
    subject = "Verify Your Email Address"
    body = f"""Hi,

Please click the link below to verify your email address.
This link is valid for 24 hours.

{verification_link}

If you did not request this, please ignore this email.

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email)


def send_order_confirmation(to_email: str, order_id: int, order_summary: str, total_amount: str, recipient_role: str = "customer"):
    subject = f"Order Confirmation - Order #{order_id}"

    if recipient_role == "customer":
        greeting = f"Thank you for your order #{order_id}. We are processing your purchase and will notify you when it ships."
    else:  # shop owner or others
        greeting = f"You have received a new order #{order_id}. Please prepare the following items for shipment."

    body = f"""Hi,

{greeting}

Order Details:
{order_summary}

Total: {total_amount}

If you have any questions, please contact our support.

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email)



def send_order_status_notification(to_email: str, order_id: int, status: str, tracking_number: str = None):
    status_lower = status.lower()
    
    # Define dynamic subject and body parts based on status
    if status_lower == "processing":
        subject = f"Your Order #{order_id} is Processing"
        status_message = f"Your order #{order_id} is currently being processed. We will update you when it ships."
        tracking_info = ""
    elif status_lower == "shipped":
        subject = f"Your Order #{order_id} has Shipped"
        status_message = f"Good news! Your order #{order_id} has been shipped."
        tracking_info = f"You can track your package with the following tracking number: {tracking_number}" if tracking_number else ""
    elif status_lower == "delivered":
        subject = f"Your Order #{order_id} has been Delivered"
        status_message = f"We're happy to inform you that your order #{order_id} has been delivered."
        tracking_info = ""
    elif status_lower == "cancelled":
        subject = f"Your Order #{order_id} has been Canceled"
        status_message = f"Your order #{order_id} has been cancelled. If this was a mistake, please contact support."
        tracking_info = ""
    else:
        subject = f"Update on Your Order #{order_id}"
        status_message = f"The status of your order #{order_id} has been updated to '{status}'."
        tracking_info = ""

    body = f"""Hi,

{status_message}

{tracking_info}

Thank you for shopping with us!

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email)



def send_delivery_confirmation(to_email: str, order_id: int):
    subject = f"Order #{order_id} Delivered"
    body = f"""Hi,

Your order #{order_id} has been delivered.

We hope you enjoy your purchase. Please reach out if you have any questions or feedback.

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email)


def send_welcome_email(to_email: str, username: str):
    subject = "Welcome to CartStream!"
    body = f"""Hi {username},

Thank you for registering with CartStream. We're excited to have you onboard!

Start exploring our products and enjoy exclusive deals.

Thanks,
CartStream Support
"""
    send_email(subject, body, to_email)