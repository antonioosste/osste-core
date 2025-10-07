-- Insert Help Center page content
INSERT INTO public.pages (
  slug, title, body_markdown, seo_description, is_published, published_at
)
VALUES (
  'help-center',
  'Help Center',
  '# Help Center
**Effective date:** October 6, 2025  
**Company:** OSSTE  
**Contact:** support@osste.com

Welcome to the Help Center. Browse quick-start guides, troubleshooting steps, and contact options.

## 1) Getting Started
- **Create an account:** Sign up and verify your email.
- **Start a project:** Create your first book, pick a template, and add chapters.
- **Record a chapter:** Use the in-app recorder or upload audio. Add images where they belong in the story.
- **Export:** Review the transcript, polish, then export to **PDF**.

## 2) Recording & Editing
- **Mic tips:** Use a quiet room; speak 6–12 inches from the mic.
- **Chapter structure:** Break long sessions into multiple chapters.
- **Insert images:** Click **Add Image** inside the editor to anchor photos at exact spots.
- **Transcripts:** Edit text, fix names/places, and add captions before export.

## 3) Billing & Plans
- **Compare plans:** See **/pricing** for minutes, storage, and export options.
- **Receipts & taxes:** Receipts are emailed automatically after purchase.
- **Refunds:** See **/terms** for the policy; email **support@osste.com** for help.

## 4) Account & Privacy
- **Change email/password:** From your account settings.
- **Delete account/data:** Request via **support@osste.com** (verification required).
- **Privacy:** How we handle data → **/privacy**.

## 5) Troubleshooting
- **Audio won''t record:** Check browser mic permissions, refresh, try another browser.
- **Upload fails:** Ensure files < 100 MB; stable internet; try again.
- **Export looks off:** Reflow long images, add page breaks, re-export.
- **Can''t sign in:** Reset password; if 2FA issues, use recovery codes or contact support.

## 6) Status & Updates
- **Service status:** (Optional) Link to a status page **/status** if you add one.
- **Release notes:** Summaries of recent improvements (coming soon).

## 7) Contact Us
- **Email:** **support@osste.com**  
- **Response time:** Typically within 1–2 business days.  
- Include your browser, steps to reproduce, and screenshots if possible.

---
_Last updated: October 6, 2025_',
  'OSSTE Help Center',
  true,
  now()
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  body_markdown = EXCLUDED.body_markdown,
  seo_description = EXCLUDED.seo_description,
  is_published = EXCLUDED.is_published,
  updated_at = now();