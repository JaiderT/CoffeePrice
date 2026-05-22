import { Link } from 'react-router-dom';

const footerSections = [
  {
    title: 'CONSULTA PUBLICA',
    links: [
      { label: 'Ver precios', to: '/precios' },
      { label: 'Noticias del cafe', to: '/noticias' },
      { label: 'Contacto', to: '/contacto' },
    ],
  },
  {
    title: 'AYUDA',
    links: [
      { label: 'Centro de ayuda', to: '/centro-de-ayuda' },
      { label: 'Como funciona CoffePrice', to: '/centro-de-ayuda' },
      { label: 'Terminos y condiciones', to: '/terminos-y-condiciones' },
      { label: 'Politica de privacidad', to: '/politica-de-privacidad' },
    ],
  },
];

const quickAccess = [
  { label: 'WhatsApp', href: 'https://wa.me/573152798859' },
  { label: 'Instagram', href: 'https://www.instagram.com/coffeprice.2026?igsh=YXg4dGNxODV1aGtx' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61575364127180' },
];

function Footer() {
  return (
    <footer className="w-full bg-[#2C1A0E] py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.5fr] lg:items-start">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">☕</span>
              <span className="text-xl font-bold text-white">CoffePrice</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#D2C0AE]">
              El precio justo del cafe, en tus manos. Informacion publica y herramientas claras para entender mejor el mercado cafetero colombiano.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickAccess.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#6B4A31] px-3 py-2 text-xs font-semibold text-[#F4E8DB] transition hover:border-[#C8A96E] hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#C8A96E]">
                  {section.title}
                </p>
                <div className="space-y-2.5">
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="block text-sm text-[#D2C0AE] transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#5B3A21] pt-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="text-xs text-[#A9907B]">2026 CoffePrice. Todos los derechos reservados.</p>
          <p className="text-xs text-[#A9907B]">Plataforma informativa para el mercado cafetero colombiano.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
