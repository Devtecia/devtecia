'use client';

import { readAttribution } from '../../lib/campaign';
import { trackWhatsApp } from './analytics';

export default function WhatsAppLink({ href, label, newTab }: { href: string; label: string; newTab: string }) {
  return (
    <a className="text-link lead-whatsapp" href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp({ angle: readAttribution().angle })}>
      {label} <span aria-hidden="true">↗</span><span className="sr-only">{newTab}</span>
    </a>
  );
}
