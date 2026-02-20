"""
Email Service - handles sending emails for password reset and notifications
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Email configuration from environment variables
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')  # App password for Gmail
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', SMTP_USER)
SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME', 'StyleGenAI')

# App configuration
APP_NAME = os.getenv('APP_NAME', 'StyleGenAI')
APP_URL = os.getenv('APP_URL', 'http://localhost:8000')  # Backend URL for reset links


def is_email_configured() -> bool:
    """Check if email service is properly configured"""
    return bool(SMTP_USER and SMTP_PASSWORD)


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML body of the email
        text_content: Plain text alternative (optional)
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not is_email_configured():
        print("[EMAIL] Email service not configured (SMTP_USER and SMTP_PASSWORD required)")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        
        # Add plain text version
        if text_content:
            part1 = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(part1)
        
        # Add HTML version
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part2)
        
        # Connect and send
        print(f"[EMAIL] Connecting to {SMTP_HOST}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        print(f"[EMAIL] Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL] Authentication failed: {e}")
        return False
    except smtplib.SMTPException as e:
        print(f"[EMAIL] SMTP error: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL] Error sending email: {e}")
        return False


def send_password_reset_email(to_email: str, reset_token: str, user_name: str = None) -> bool:
    """
    Send password reset email with secure link
    
    Args:
        to_email: User's email address
        reset_token: Secure reset token
        user_name: Optional user name for personalization
        
    Returns:
        bool: True if email sent successfully
    """
    reset_link = f"{APP_URL}/auth/reset-password-page?token={reset_token}"
    
    greeting = f"Salut{' ' + user_name if user_name else ''},"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resetare Parolă - {APP_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                        ✨ {APP_NAME}
                    </h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                        Resetare Parolă
                    </h2>
                    <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        {greeting}
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                        Am primit o cerere de resetare a parolei pentru contul tău. 
                        Apasă butonul de mai jos pentru a seta o parolă nouă:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            🔐 Resetează Parola
                        </a>
                    </div>
                    <p style="color: #999999; font-size: 14px; line-height: 22px; margin: 30px 0 0 0;">
                        Link-ul este valid pentru <strong>1 oră</strong>. 
                        Dacă nu ai solicitat resetarea parolei, poți ignora acest email în siguranță.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                    <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0;">
                        Dacă butonul nu funcționează, copiază și lipește acest link în browser:
                        <br>
                        <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2024 {APP_NAME}. Toate drepturile rezervate.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    text_content = f"""
    Resetare Parolă - {APP_NAME}
    
    {greeting}
    
    Am primit o cerere de resetare a parolei pentru contul tău.
    
    Pentru a seta o parolă nouă, accesează acest link:
    {reset_link}
    
    Link-ul este valid pentru 1 oră.
    
    Dacă nu ai solicitat resetarea parolei, poți ignora acest email în siguranță.
    
    ---
    {APP_NAME}
    """
    
    subject = f"🔐 Resetare Parolă - {APP_NAME}"
    
    return send_email(to_email, subject, html_content, text_content)


def send_password_changed_notification(to_email: str, user_name: str = None) -> bool:
    """
    Send notification when password was successfully changed
    
    Args:
        to_email: User's email address
        user_name: Optional user name for personalization
        
    Returns:
        bool: True if email sent successfully
    """
    greeting = f"Salut{' ' + user_name if user_name else ''},"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                        ✨ {APP_NAME}
                    </h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                        ✅ Parolă Schimbată cu Succes
                    </h2>
                    <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        {greeting}
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        Parola contului tău a fost schimbată cu succes. 
                        Acum te poți autentifica cu noua parolă.
                    </p>
                    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; font-size: 14px; margin: 0;">
                            ⚠️ <strong>Atenție:</strong> Dacă nu tu ai făcut această schimbare, 
                            te rugăm să ne contactezi imediat.
                        </p>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2024 {APP_NAME}. Toate drepturile rezervate.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    text_content = f"""
    Parolă Schimbată cu Succes - {APP_NAME}
    
    {greeting}
    
    Parola contului tău a fost schimbată cu succes.
    Acum te poți autentifica cu noua parolă.
    
    ⚠️ Atenție: Dacă nu tu ai făcut această schimbare, te rugăm să ne contactezi imediat.
    
    ---
    {APP_NAME}
    """
    
    subject = f"✅ Parolă Schimbată - {APP_NAME}"
    
    return send_email(to_email, subject, html_content, text_content)
