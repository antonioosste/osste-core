-- Insert Privacy Policy page
insert into public.pages (
  slug, title, body_markdown, seo_description, is_published, published_at
)
values (
  'privacy',
  'Privacy Policy',
  $$# Privacy Policy
**Effective date:** October 6, 2025  
**Company:** OSSTE ("OSSTE", "we", "us", or "our")  
**Contact:** privacy@osste.com

This Privacy Policy explains how we collect, use, and share information when you use OSSTE's website, applications, and related services ("Services").

## 1. Information We Collect
### Account & Contact
Name, email, password (hashed), and settings you provide.

### Usage & Device
IP address, browser type, pages viewed, timestamps, and referral URLs (via cookies and analytics).

### Content You Provide
Text, audio recordings, transcripts, images, and other materials you upload ("User Content").

### Payments
If you purchase through our checkout provider (e.g., Stripe), they process your payment details. We receive limited billing metadata (e.g., last4, card brand, status) but **not** full card numbers.

## 2. How We Use Information
- Provide, personalize, and improve the Services.  
- Transcribe, structure, and polish narratives from your recordings as requested.  
- Generate exports (e.g., PDFs/books) that you initiate.  
- Communicate about updates, security, and support.  
- Prevent fraud, abuse, and violations of our Terms of Service.

## 3. Legal Bases (EEA/UK)
We process data to perform a contract with you, with your consent (e.g., marketing), and for legitimate interests (e.g., service security). You may withdraw consent at any time.

## 4. Sharing of Information
We do **not** sell your personal information. We share only as needed to operate the Services:
- **Vendors/Processors:** hosting, analytics, transcription, email, and payment providers bound by confidentiality and data-processing terms.  
- **Legal:** to comply with law or protect rights, safety, and security.  
- **With Your Direction:** when you export/share a project or invite collaborators.

## 5. Cookies & Analytics
We use essential cookies for login and security, and analytics cookies to understand product usage. You can manage cookies via your browser settings. Blocking some cookies may affect functionality.

## 6. Data Retention
We retain information while your account is active and as needed to provide the Services. You may request deletion of your account and associated User Content (subject to legal/backup constraints).

## 7. Your Rights
Depending on your region, you may have rights to access, correct, delete, or export your data, and to object or restrict certain processing. Contact **privacy@osste.com** to exercise rights.

## 8. Children
OSSTE is not directed to children under 13 (or the minimum age in your jurisdiction). We do not knowingly collect information from children.

## 9. Security
We use administrative, technical, and physical safeguards to protect information. No method of transmission or storage is 100% secure, but we continually improve our protections.

## 10. International Transfers
We may process and store information in the United States and other countries. Where required, we use appropriate safeguards for cross-border transfers.

## 11. Third-Party Links
Our Services may link to third-party sites or services. Their practices are governed by their own policies.

## 12. Changes to this Policy
We may update this Policy from time to time. Material changes will be posted on the site or communicated to you. Your continued use of the Services after changes become effective signifies acceptance.

## 13. Contact Us
Questions about privacy or this Policy? Email **privacy@osste.com** or **support@osste.com**.

---
Last updated: October 6, 2025
$$,
  'OSSTE Privacy Policy',
  true,
  now()
)
on conflict (slug) do update
set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  seo_description = excluded.seo_description,
  is_published = excluded.is_published,
  updated_at = now();