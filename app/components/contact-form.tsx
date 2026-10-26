'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { angleInterest, metaBrowserIds, readAttribution, privacyUrl } from '../../lib/campaign';
import { readConsent, trackingIds } from '../../lib/consent';
import { hashContact, markLead, newEventId, thanksUrl } from '../../lib/lead';
import { getDictionary, localePath, type Locale } from '../i18n';

type State = 'idle' | 'pending' | 'error';
type Field = 'name' | 'email' | 'message' | 'phone';
type Errors = Partial<Record<Field, string>>;

const fields: Field[] = ['name', 'email', 'phone', 'message'];
// Mirrors the server pattern in lib/contact.mjs so the client never accepts what the API rejects.
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
// Same rule as lib/contact.mjs: optional, 7 to 15 digits, usual separators only.
const phonePattern = /^\+?[\d\s().-]{6,30}$/;
const digits = (value: string) => (value.match(/\d/g) ?? []).length;

export default function ContactForm({ locale = 'es' }: { locale?: Locale }) {
  const t = getDictionary(locale).form;
  const [state, setState] = useState<State>('idle');
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const dirty = useRef<Set<Field>>(new Set());
  const form = useRef<HTMLFormElement>(null);
  const privacy = privacyUrl(process.env.NEXT_PUBLIC_PRIVACY_URL);

  // An ad that points at ?a=excel|tareas|medida lands with the matching interest already chosen,
  // and the home highlights the matching starting point. The visitor can still change it.
  useEffect(() => {
    const { angle } = readAttribution();
    if (!angle) return;
    document.documentElement.dataset.angle = angle;
    const interest = angleInterest(angle);
    const radios = form.current?.querySelectorAll<HTMLInputElement>('input[name="interest"]');
    if (interest && radios && ![...radios].some(radio => radio.checked)) {
      radios.forEach(radio => { radio.checked = radio.value === interest; });
    }
  }, []);

  // After a successful send the form stays pending while the browser opens the thanks page. Coming back with the
  // back button can restore this page from the back-forward cache in that state, so unlock it again.
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setState('idle');
      setNotice('');
    };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  function check(field: Field, value: string) {
    if (field === 'name') return value.trim().length < 2 ? t.errors.name : '';
    if (field === 'email') {
      if (value.trim() === '') return t.errors.emailRequired;
      return emailPattern.test(value) ? '' : t.errors.email;
    }
    if (field === 'phone') {
      const phone = value.trim();
      return phone === '' || (phonePattern.test(phone) && digits(phone) >= 7 && digits(phone) <= 15) ? '' : t.errors.phone;
    }
    // The message is optional; if the visitor starts one, it has to say something.
    return value.trim() !== '' && value.trim().length < 10 ? t.errors.message : '';
  }

  function update(field: Field, value: string) {
    setErrors(current => ({ ...current, [field]: check(field, value) }));
  }

  function blur(field: Field, value: string) {
    if (dirty.current.has(field) || errors[field]) update(field, value);
  }

  function input(field: Field, value: string) {
    dirty.current.add(field);
    if (errors[field]) update(field, value);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'pending') return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const found: Errors = {};
    for (const field of fields) {
      const error = check(field, String(data.get(field) ?? ''));
      if (error) found[field] = error;
    }
    setErrors(found);
    const firstInvalid = fields.find(field => found[field]);
    if (firstInvalid) {
      setState('idle');
      setNotice('');
      form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }
    setState('pending');
    setNotice(t.sending);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    // One id per submission, shared by the server Conversions API event and the Pixel on the thanks page.
    const eventId = newEventId();
    const attribution = readAttribution();
    let consent = null;
    try { consent = readConsent(window.localStorage); } catch { /* blocked storage means no consent */ }
    let cookie = '';
    try { cookie = document.cookie; } catch { /* blocked cookies */ }
    const meta = metaBrowserIds(cookie, window.location.search, attribution.fbclid, Date.now());
    // Google Ads enhanced conversions: only SHA-256 hashes, computed while the request is in flight, and only when the
    // visitor already accepted measurement and Google Ads is configured. The raw values never reach storage.
    const contactHashes = consent === 'granted' && trackingIds().ads
      ? hashContact({ email: String(data.get('email') ?? ''), phone: String(data.get('phone') ?? '') })
      : Promise.resolve({});
    try {
      const response = await fetch(locale === 'es' ? '/api/contact' : `/api/contact?lang=${locale}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(data), attribution, eventId, consent: consent === 'granted' ? 'granted' : 'denied',
          ...meta, pageUrl: window.location.href.split('#')[0],
        }), signal: controller.signal,
      });
      const result = await response.json();
      if (response.status !== 202) throw new Error(typeof result.message === 'string' ? result.message : t.unconfirmed);
      // Only after the server confirmed: the thanks page counts the lead once, from this marker. If storage is blocked
      // the visitor still gets there, just untracked. The form stays pending (button disabled) while the page changes.
      let store: Storage | undefined;
      try { store = window.sessionStorage; } catch { /* blocked storage */ }
      markLead(store, { angle: attribution.angle, interest: String(data.get('interest') ?? ''), eventId, ...await contactHashes }, Date.now());
      window.location.assign(thanksUrl(localePath(locale, 'thanks'), window.location.search));
      return;
    } catch (error) {
      setState('error');
      setNotice(error instanceof Error && error.name !== 'AbortError'
        ? error.message
        : t.timeout);
    } finally {
      window.clearTimeout(timer);
    }
  }

  const describedBy = (field: Field) => errors[field] ? `${field}-error` : undefined;
  const fieldError = (field: Field) => errors[field] && <p id={`${field}-error`} className="contact-field-error">{errors[field]}</p>;

  return (
    <form ref={form} className="contact-panel contact-form" onSubmit={submit} noValidate aria-busy={state === 'pending'} aria-describedby="contact-use">
      <fieldset className="contact-interest">
        <legend>{t.interestLegend} <span>{t.optional}</span></legend>
        <div className="contact-chips">{t.interests.map(([value, label]) => (
          <label className="contact-chip" key={value}>
            <input type="radio" name="interest" value={value} />
            <span>{label}</span>
          </label>
        ))}</div>
      </fieldset>
      <div className="contact-field">
        <label htmlFor="name">{t.name}</label>
        <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={100}
          aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')}
          onBlur={event => blur('name', event.currentTarget.value)} onInput={event => input('name', event.currentTarget.value)} />
        {fieldError('name')}
      </div>
      <div className="contact-field">
        <label htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
          aria-invalid={Boolean(errors.email)} aria-describedby={describedBy('email')}
          onBlur={event => blur('email', event.currentTarget.value)} onInput={event => input('email', event.currentTarget.value)} />
        {fieldError('email')}
      </div>
      <div className="contact-field">
        <label htmlFor="phone">{t.phone} <span>{t.optional}</span></label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30}
          aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy('phone')}
          onBlur={event => blur('phone', event.currentTarget.value)} onInput={event => input('phone', event.currentTarget.value)} />
        {fieldError('phone')}
      </div>
      <div className="contact-field">
        <label htmlFor="company">{t.company} <span>{t.optional}</span></label>
        <input id="company" name="company" autoComplete="organization" maxLength={150} />
      </div>
      <div className="contact-field">
        <label htmlFor="message">{t.message} <span>{t.optional}</span></label>
        <textarea id="message" name="message" maxLength={4000} rows={5} placeholder={t.placeholder}
          aria-invalid={Boolean(errors.message)} aria-describedby={describedBy('message')}
          onBlur={event => blur('message', event.currentTarget.value)} onInput={event => input('message', event.currentTarget.value)} />
        {fieldError('message')}
      </div>
      <div className="contact-trap" aria-hidden="true">
        <label htmlFor="website">{t.trap}</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p id="contact-use" className="contact-note">{t.use} {t.reassure}{privacy && <> <a className="text-link" href={privacy}>{t.privacy}</a></>}</p>
      <button className="button contact-submit" type="submit" disabled={state === 'pending'}>
        {state === 'pending' ? t.pendingButton : t.submit}
      </button>
      <p className={state === 'error' ? 'contact-notice contact-notice-error' : 'contact-notice'} role={state === 'error' ? 'alert' : 'status'} aria-live="polite">{notice}</p>
      <noscript>{t.noscript}</noscript>
    </form>
  );
}
