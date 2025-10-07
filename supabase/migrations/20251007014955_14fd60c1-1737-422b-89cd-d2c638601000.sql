-- Create the handle_updated_at function first
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create pages table for static content
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body_markdown TEXT,
  seo_description TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Allow public to view published pages
CREATE POLICY "Anyone can view published pages"
ON public.pages
FOR SELECT
USING (is_published = true);

-- Allow authenticated users to manage pages (you can restrict this further later)
CREATE POLICY "Authenticated users can manage pages"
ON public.pages
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert Terms of Service
INSERT INTO public.pages (
  slug, title, body_markdown, seo_description, is_published, published_at
)
VALUES (
  'terms',
  'Terms of Service',
  '# Terms of Service
**Effective date:** October 6, 2025  
**Company:** OSSTE ("OSSTE", "we", "us", or "our")  
**Contact:** support@osste.com

These Terms of Service ("Terms") govern your access to and use of the OSSTE website, applications, and related services (collectively, the "Services"). By accessing or using the Services, you agree to be bound by these Terms.

## 1. Eligibility & Accounts
You must be at least 13 years old (or the minimum age in your jurisdiction) to use the Services. When you create an account, you agree to provide accurate information and to keep your credentials confidential. You are responsible for all activity under your account.

## 2. Purchases & Billing
Certain features are paid. Prices, taxes, and plan details are described at **/pricing** or during checkout. Payments are processed by our third-party provider (e.g., Stripe). By submitting a purchase, you authorize us and our processor to charge your payment method for the applicable fees.

### Refunds
Unless stated otherwise in a plan''s description, purchases are non-refundable once recording, editing, or export features have been used. If you believe a charge was made in error, contact **support@osste.com** within 7 days.

## 3. User Content & Recordings
You may submit text, audio, images, video, and other materials ("User Content"). You retain ownership of your User Content. By submitting User Content, you grant OSSTE a worldwide, non-exclusive, royalty-free license to host, process, transcribe, edit (to produce polished narratives), and generate exports (e.g., PDF/books) solely to provide the Services to you and those you designate.

You are responsible for obtaining all necessary rights and permissions for any individuals or materials included in your User Content, including consent for recordings and images.

## 4. Intellectual Property
All OSSTE software, templates, designs, and branding are owned by OSSTE and protected by intellectual-property laws. Except for your User Content and rights expressly granted in these Terms, no rights are transferred to you.

## 5. Acceptable Use
You agree not to:
- Use the Services for unlawful, infringing, or harmful activities;
- Upload content that violates privacy, intellectual-property, or publicity rights;
- Attempt to reverse engineer, bypass security, or disrupt the Services;
- Misrepresent your affiliation or impersonate others.

We may remove content or suspend accounts that violate these Terms.

## 6. Privacy
Your use of the Services is also subject to our **Privacy Policy** (see **/privacy**), which explains how we collect and use personal information.

## 7. Third-Party Services
The Services may link to or integrate with third-party services (e.g., Stripe, cloud storage, print vendors). We are not responsible for third-party terms, policies, or actions.

## 8. Disclaimers
The Services are provided "as is" and "as available." To the fullest extent permitted by law, OSSTE disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Services will be uninterrupted or error-free.

## 9. Limitation of Liability
To the fullest extent permitted by law, OSSTE and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, use, goodwill, or profits, arising from or related to your use of the Services. Our total liability shall not exceed the amount you paid to OSSTE in the 12 months preceding the claim.

## 10. Indemnification
You agree to indemnify and hold harmless OSSTE from any claims, liabilities, damages, and expenses (including reasonable attorneys'' fees) arising from your User Content or your violation of these Terms.

## 11. Governing Law & Disputes
These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules. You agree to submit to the exclusive jurisdiction of state and federal courts located in Harris County, Texas, for any dispute not subject to arbitration.

## 12. Changes to the Services or Terms
We may modify the Services or these Terms from time to time. Material changes will be posted on the site or communicated to you. Your continued use of the Services after changes become effective constitutes acceptance.

## 13. Termination
You may stop using the Services at any time. We may suspend or terminate access if you violate these Terms, to comply with law, or to protect the Services. Upon termination, certain provisions (e.g., ownership, disclaimers, limitations of liability) survive.

## 14. Contact
Questions about these Terms? Email **support@osste.com**.

---
Last updated: October 6, 2025',
  'OSSTE Terms of Service',
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