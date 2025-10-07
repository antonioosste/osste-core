-- Insert Cookie Policy page
insert into public.pages (
  slug, title, body_markdown, seo_description, is_published, published_at
)
values (
  'cookies',
  'Cookie Policy',
  $$# Cookie Policy
**Effective date:** October 6, 2025  
**Company:** OSSTE ("we", "us", "our")  
**Contact:** privacy@osste.com

This Cookie Policy explains how OSSTE uses cookies and similar technologies on our website and apps ("Services").

## 1) What are cookies?
Cookies are small text files stored on your device by a website. They let the site remember your actions and preferences over time.

We also use related technologies such as local storage, pixels, and SDKs. For simplicity, we call all of these **cookies**.

## 2) Types of cookies we use
- **Strictly Necessary** – Required for core functionality (login, security, load balancing). These cannot be switched off in our systems.  
- **Performance/Analytics** – Help us understand usage to improve the product (e.g., pages visited, time on page).  
- **Functional** – Remember preferences (e.g., language, saved settings).  
- **Marketing** – Measure campaigns and, where applicable, deliver/measure ads.

## 3) Cookies we commonly set
- **Session / Auth** (necessary): keeps you signed in, protects against CSRF, routes traffic.  
- **Analytics** (performance): aggregates page views and events to improve features.  
- **Preference** (functional): stores your theme, last-used workspace, or dismissed banners.

> We do **not** sell personal information. See our **Privacy Policy** at **/privacy** for full details on data handling.

## 4) How long do cookies last?
- **Session cookies** expire when you close your browser.  
- **Persistent cookies** stay until they expire or you delete them (typically 1–24 months).

## 5) Your choices
- **Cookie banner:** On first visit, you can accept or manage non-essential cookies.  
- **Browser controls:** You can block or delete cookies in your browser settings. Blocking some cookies may affect site functionality.  
- **Analytics opt-out:** Many analytics providers offer their own opt-out mechanisms.

## 6) Do Not Track
Some browsers send a "Do Not Track" (DNT) signal. Our Services don't currently respond to DNT, but you can still control cookies as described above.

## 7) Changes to this policy
We may update this Cookie Policy from time to time. Material changes will be posted here and, where appropriate, shown in the banner.

## 8) Contact us
Questions about cookies? Email **privacy@osste.com**.

---
Last updated: October 6, 2025
$$,
  'OSSTE Cookie Policy',
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