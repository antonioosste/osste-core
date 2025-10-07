-- Insert FAQ page content
INSERT INTO public.pages (
  slug, title, body_markdown, seo_description, is_published, published_at
)
VALUES (
  'faq',
  'Frequently Asked Questions',
  '# Frequently Asked Questions (FAQ)
**Effective date:** October 6, 2025  
**Company:** OSSTE  
**Contact:** support@osste.com

Below are answers to the most common questions about recording, editing, and exporting your family stories.

## Getting Started
### What is OSSTE?
OSSTE lets you capture voice interviews, organize them into chapters, add images, and export a polished PDF/book.

### Do I need special equipment?
No. Any modern phone or computer microphone works. A quiet room helps.

### Can I invite family members?
Yes. You can share a recording link or invite them to collaborate on chapters (view/comment/edit based on permissions).

## Recording & Chapters
### How long can I record?
Depends on your plan. See **/pricing** for minutes included. You can split long sessions into chapters.

### Can I add images to a chapter?
Yes. Use **Add Image** in the editor to insert photos exactly where you want them in the final PDF.

### Can I edit or re-record parts?
You can trim, re-record sections, and edit text transcripts before exporting.

## Privacy & Ownership
### Who owns my recordings and photos?
You do. OSSTE only processes your content to provide the services you request (see **/privacy**).

### Are my files secure?
We use encrypted storage and access controls. Share-only links can be revoked at any time.

## Plans & Billing
### What are the plan options?
Starter, Standard, and Premium. Compare on **/pricing**.

### Do you offer refunds?
If you haven''t used recording/editing/export features, contact **support@osste.com** within 7 days. See **/terms**.

## Exports & Delivery
### What formats can I export?
PDF is standard. Premium plans may include audio bundles and print-ready files.

### Can you print a hardcover book?
Yes—Premium includes a print-ready PDF. Printing/fulfillment partners may be available as add-ons.

## Support
### How do I get help?
Email **support@osste.com** or see **/help-center** for guides and troubleshooting.

---
_Last updated: October 6, 2025_',
  'OSSTE Frequently Asked Questions',
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