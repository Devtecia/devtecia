// Mobile sticky CTA: a bar fixed at the bottom of phones that jumps to the inline contact form. It only shows when
// the visitor can no longer see the hero call to action nor the form itself, and steps aside while the consent banner
// is open, so the two never stack on a small screen.
export type StickyCtaState = { heroInView: boolean; formInView: boolean; consentOpen: boolean };

/** The contact form section on the home page. */
export const STICKY_CTA_TARGET = '#hablemos';
/** The hero buttons: once they scroll away, the bar takes over. */
export const STICKY_CTA_HERO = '.hero .hero-actions';
/** Height the bar reserves at the bottom of the page while it is on screen; 0 or unset otherwise. */
export const STICKY_OFFSET_VAR = '--sticky-offset';

export const showStickyCta = ({ heroInView, formInView, consentOpen }: StickyCtaState) => !heroInView && !formInView && !consentOpen;
