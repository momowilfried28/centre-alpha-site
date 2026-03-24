"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
        
        {/* Logo / Nom du centre */}
        <Link href="/" className="text-2xl font-bold text-blue-700">
          Centre Alpha
        </Link>

        {/* Menu desktop */}
        <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
          <li><Link href="/" className="hover:text-blue-600">Accueil</Link></li>
          <li><Link href="/services" className="hover:text-blue-600">Services</Link></li>
          <li><Link href="/horaire" className="hover:text-blue-600">Horaire</Link></li>
          <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
        </ul>

        {/* Bouton mobile */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <ul className="md:hidden bg-white border-t p-4 space-y-4 text-gray-700 font-medium">
          <li><Link href="/" onClick={() => setOpen(false)}>Accueil</Link></li>
          <li><Link href="/services" onClick={() => setOpen(false)}>Services</Link></li>
          <li><Link href="/horaire" onClick={() => setOpen(false)}>Horaire</Link></li>
          <li><Link href="/contact" onClick={() => setOpen(false)}>Contact</Link></li>
        </ul>
      )}
    </header>
  );
}
