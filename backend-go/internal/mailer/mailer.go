package mailer

import (
	"fmt"
	"html"
	"net/smtp"
	"strings"

	"github.com/gcclinux/dominikaswioklo/backend-go/internal/config"
)

// Mailer handles sending emails via SMTP.
type Mailer struct {
	cfg  config.SMTPConfig
	from string
}

// New creates a new Mailer instance.
func New(cfg config.SMTPConfig, from string) *Mailer {
	return &Mailer{
		cfg:  cfg,
		from: from,
	}
}

// SendContact sends a contact form email.
func (m *Mailer) SendContact(to, name, email, message string) error {
	subject := fmt.Sprintf("New Contact Form Submission from %s", name)

	body := buildHTMLEmail(name, email, message)

	msg := buildMIMEMessage(m.from, to, subject, body)

	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)
	auth := smtp.PlainAuth("", m.cfg.User, m.cfg.Pass, m.cfg.Host)

	err := smtp.SendMail(addr, auth, m.from, []string{to}, []byte(msg))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func buildMIMEMessage(from, to, subject, htmlBody string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("From: %s\r\n", from))
	sb.WriteString(fmt.Sprintf("To: %s\r\n", to))
	sb.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	sb.WriteString("MIME-Version: 1.0\r\n")
	sb.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	sb.WriteString("\r\n")
	sb.WriteString(htmlBody)
	return sb.String()
}

func buildHTMLEmail(name, email, message string) string {
	return fmt.Sprintf(`<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> %s</p>
<p><strong>Email:</strong> %s</p>
<p><strong>Message:</strong></p>
<p>%s</p>`, html.EscapeString(name), html.EscapeString(email), html.EscapeString(message))
}
