# EmailJS Template Configuration

## Template Settings (Top of Template Editor)

### Template 1: One-Time Password (template_5ddyq11)

**Template Settings (at the top):**
- **Template Name:** One-Time Password
- **To Email:** `{{to_email}}`  ⚠️ MUST BE SET
- **From Name:** TruView Team
- **Subject:** Verify Your Email - TruView
- **Reply To:** (leave empty or use `{{reply_to}}`)

**Template Content (Body):**
```
Hello {{to_name}},

Welcome to TruView! Thank you for signing up.

Your verification code is:

{{otp_code}}

This code will expire in 10 minutes.

Enter this code in the verification form to activate your account.

If you didn't create an account with TruView, please ignore this email.

Best regards,
The TruView Team

---
This is an automated message. Please do not reply to this email.
```

---

### Template 2: Password Reset (template_dj89rjm)

**Template Settings (at the top):**
- **Template Name:** Password Reset
- **To Email:** `{{to_email}}` ⚠️ MUST BE SET
- **From Name:** TruView Team
- **Subject:** Reset Your Password - TruView
- **Reply To:** (leave empty or use `{{reply_to}}`)

**Template Content (Body):**
```
Hello {{to_name}},

We received a request to reset your password for your TruView account.

Your password reset code is:

{{otp_code}}

This code will expire in 10 minutes.

⚠️ Security Notice:
- Never share this code with anyone
- TruView will never ask for your password via email
- If you didn't request this reset, please contact support immediately

Enter this code in the password reset form to create a new password for your account.

Best regards,
The TruView Security Team

---
This is an automated message. Please do not reply to this email.
```

---

## Important Notes

1. **To Email field is MANDATORY** - Without `{{to_email}}` in the "To Email" field at the top, EmailJS will return "recipients address is empty"

2. **Template Variables** - Make sure these variables are in your template:
   - `{{to_email}}` - in the "To Email" field
   - `{{to_name}}` - recipient's name
   - `{{otp_code}}` - the verification code
   - `{{user_name}}` - user's name (optional)

3. **Testing** - After saving, use the "Send Test Email" button in EmailJS to verify the template works

4. **Common Mistakes**:
   - Forgetting to set `{{to_email}}` in the "To Email" field
   - Using wrong variable names (case sensitive)
   - Not saving the template after changes

## Visual Guide

```
┌─────────────────────────────────────────────────┐
│ Template Editor                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ To Email: [{{to_email}}]  ← MUST BE SET HERE   │
│ From Name: [TruView Team]                       │
│ Subject: [Verify Your Email - TruView]          │
│ Reply To: []                                     │
│                                                  │
├─────────────────────────────────────────────────┤
│ Content:                                         │
│                                                  │
│ Hello {{to_name}},                              │
│                                                  │
│ Your verification code is:                       │
│ {{otp_code}}                                    │
│                                                  │
│ ...                                              │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### Error: "The recipients address is empty"
- **Cause:** The "To Email" field at the top is not set to `{{to_email}}`
- **Fix:** Edit template → Set "To Email" field to `{{to_email}}` → Save

### Error: "Template not found"
- **Cause:** Template ID doesn't match or template is not published
- **Fix:** Verify template ID in dashboard matches `.env.local`

### Email not sending
- **Cause:** Service not connected or account limit reached
- **Fix:** Check service connection and monthly usage limit

## Quick Setup Checklist

- [ ] Create template in EmailJS dashboard
- [ ] Set "To Email" field to `{{to_email}}`
- [ ] Set "From Name" to "TruView Team"
- [ ] Set "Subject" appropriately
- [ ] Add template content with `{{to_name}}` and `{{otp_code}}`
- [ ] Save template
- [ ] Test template with "Send Test Email" button
- [ ] Copy template ID to `.env.local`
- [ ] Restart dev server
