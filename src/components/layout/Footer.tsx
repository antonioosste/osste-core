import { Link } from "react-router-dom";

const footerLinks = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Demo", href: "/session" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "Help Center", href: "/help" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-ink border-t border-cream/10">
      <div className="container mx-auto px-6 py-12 md:py-16">
        {/* Top: centered logo */}
        <div className="flex justify-center mb-10">
          <Link to="/">
            <img
              src="/brand/osste-logo-main.png"
              alt="OSSTE"
              className="h-10 w-auto opacity-60 brightness-200"
            />
          </Link>
        </div>

        {/* Tagline */}
        <p className="text-center text-sm text-cream/50 font-body italic mb-10">
          Every life deserves to be written.
        </p>

        {/* Links row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-center mb-10">
          <div>
            <h3 className="eyebrow text-gold-light mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors font-sans"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-gold-light mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors font-sans"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-gold-light mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors font-sans"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cream/10 pt-6">
          <p className="text-center text-xs text-cream/40 font-sans">
            © {new Date().getFullYear()} OSSTE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
