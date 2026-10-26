import { isGaId, isMetaPixelId } from '../../lib/campaign';

// Meta Pixel and GA4, switched on only by NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_GA_ID. Without them this renders
// nothing, so the site tracks nobody until someone configures it on purpose. Plain script tags (not next/script) so the
// markup is visible to tests; the external files load async and never block rendering.
type Props = { metaPixelId?: string; gaId?: string };

export default function Tracking({ metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID, gaId = process.env.NEXT_PUBLIC_GA_ID }: Props) {
  const meta = isMetaPixelId(metaPixelId) ? metaPixelId : '';
  const ga = isGaId(gaId) ? gaId : '';
  if (!meta && !ga) return null;
  return (
    <>
      {meta && <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${meta}');fbq('track', 'PageView');` }} />}
      {ga && <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />}
      {ga && <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js', new Date());gtag('config', '${ga}');` }} />}
    </>
  );
}
