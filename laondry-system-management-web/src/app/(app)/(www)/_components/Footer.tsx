import { FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaInstagram, FaTwitter } from "react-icons/fa";

type ContactItem = { icon: React.ReactNode; text: string; href?: string };



const CONTACTS: ContactItem[] = [
  {
    icon: <FaWhatsapp className="text-brand-500" />,
    text: "08xx-xxxx-xxxx",
    href: "https://wa.me/62xxxxxxxxxx",
  },
  { icon: <FaMapMarkerAlt className="text-brand-500" />, text: "Jl. Contoh No. 123, Tangerang" },
  {
    icon: <FaEnvelope className="text-brand-500" />,
    text: "support@sahabatlaundry.id",
    href: "mailto:support@sahabatlaundry.id",
  },
];

const SOCIALS = [
  { name: "Instagram", icon: <FaInstagram />, href: "#" },
  { name: "Twitter", icon: <FaTwitter />, href: "#" },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-surface/30">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-4">
        <div>
          <div className="text-2xl font-bold">Sahabat Laundry</div>
          <p className="text-foreground/80 mt-4 max-w-sm">
            Layanan laundry praktis dengan antar jemput cepat, bersih, dan higienis. 
            Solusi terbaik untuk kebutuhan perawatan pakaian Anda.
          </p>
          <div className="mt-6 flex gap-4">
            {SOCIALS.map((social, i) => (
              <a 
                key={i} 
                href={social.href} 
                className="text-foreground/70 hover:text-brand-500 transition-colors"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Layanan</h3>
          <ul className="space-y-3">
            <li><a href="#services" className="text-foreground/80 hover:text-brand-500 transition">Cuci Kering</a></li>
            <li><a href="#services" className="text-foreground/80 hover:text-brand-500 transition">Cuci Lipat</a></li>
            <li><a href="#services" className="text-foreground/80 hover:text-brand-500 transition">Setrika</a></li>
            <li><a href="#services" className="text-foreground/80 hover:text-brand-500 transition">Express 24 Jam</a></li>
            <li><a href="#services" className="text-foreground/80 hover:text-brand-500 transition">Dry Cleaning</a></li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Berlangganan</h3>
          <p className="text-foreground/80 mb-4">Dapatkan promo dan update terbaru</p>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Email Anda" 
              className="border-border bg-background text-foreground flex-grow rounded-l-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button className="bg-brand-500 text-on-primary px-4 py-2 rounded-r-lg font-medium hover:bg-brand-600 transition-colors">
              Ikut
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Kontak</h3>
          <ul className="text-foreground/80 space-y-3">
            {CONTACTS.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1">{c.icon}</div>
                {c.href ? (
                  <a href={c.href} className="hover:text-brand-500 transition">
                    {c.text}
                  </a>
                ) : (
                  <span>{c.text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FooterBottom />
    </footer>
  );
}

function FooterBottom() {
  return (
    <div className="border-border/60 border-t">
      <div className="text-foreground/60 mx-auto max-w-6xl px-4 py-6 text-center text-sm">
        © {new Date().getFullYear()} Sahabat Laundry. All rights reserved.
      </div>
    </div>
  );
}