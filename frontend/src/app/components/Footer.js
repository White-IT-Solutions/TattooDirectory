import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        {/* Logo / Name */}
        <div className="text-lg font-semibold mb-4 md:mb-0">
          Tattoo Directory © {new Date().getFullYear()}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="hover:text-white transition">
            Terms & Service
          </Link>
          <Link href="/privacy" className="hover:text-white transition">
            Data Privacy
          </Link>
          <Link href="/status" className="hover:text-white transition">
            Status & Uptime
          </Link>
          <Link href="/takedown" className="hover:text-white transition">
            Takedown Request
          </Link>
          <Link href="/faq" className="hover:text-white transition">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
