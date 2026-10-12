import { ImageResponse } from 'next/og';
import { getDictionary, type Locale } from '../i18n';

export const ogSize = { width: 1200, height: 630 };

export function renderOgImage(locale: Locale) {
  const { meta, tagline } = getDictionary(locale);
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#EDF0F2', color: '#25292D', width: '100%', height: '100%', padding: '64px 80px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="48" height="48" viewBox="0 0 48 48"><path d="M9 8h14c12 0 19 6 19 16s-7 16-19 16H9V8Z" fill="none" stroke="#25292D" strokeWidth="5" /><path d="m17 17 7 7-7 7M29 17v14" fill="none" stroke="#25292D" strokeWidth="3.5" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 36, fontWeight: 700 }}>Devtecia</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 80, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-4px' }}><span>{meta.ogImageLines[0]}</span><span>{meta.ogImageLines[1]}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#526677', fontSize: 24 }}><span>{tagline.lines.join(' ')}</span><span>devtecia.com</span></div>
    </div>,
    ogSize,
  );
}
