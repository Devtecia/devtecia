'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getDictionary, localePath, type Locale } from '../i18n';

type State = 'idle' | 'pending' | 'error' | 'accepted';
type Field = 'name' | 'email' | 'message';
type Errors = Partial<Record<Field, string>>;

const fields: Field[] = ['name', 'email', 'message'];
// Mirrors the server pattern in lib/contact.mjs so the client never accepts what the API rejects.
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

export default function ContactForm({ locale = 'es' }: { locale?: Locale }) {
  const t = getDictionary(locale).form;
  const [state, setState] = useState<State>('idle');
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const dirty = useRef<Set<Field>>(new Set());
  const successHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state === 'accepted') successHeading.current?.focus();
  }, [state]);

  function check(field: Field, value: string) {
    if (field === 'name') return value.trim().length < 2 ? t.errors.name : '';
    if (field === 'email') {
      if (value.trim() === '') return t.errors.emailRequired;
      return emailPattern.test(value) ? '' : t.errors.email;
    }
    return value.trim().length < 10 ? t.errors.message : '';
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
    try {
      const response = await fetch(locale === 'es' ? '/api/contact' : `/api/contact?lang=${locale}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)), signal: controller.signal,
      });
      const result = await response.json();
      if (response.status !== 202) throw new Error(typeof result.message === 'string' ? result.message : t.unconfirmed);
      setState('accepted');
      setNotice('');
    } catch (error) {
      setState('error');
      setNotice(error instanceof Error && error.name !== 'AbortError'
        ? error.message
        : t.timeout);
    } finally {
      window.clearTimeout(timer);
    }
  }

  if (state === 'accepted') {
    return (
      <div className="contact-panel contact-success">
        <div className="contact-sent" aria-hidden="true">
          <span className="contact-sent-card"><span /><span /><span /></span>
          <svg className="contact-sent-check" viewBox="0 0 48 48" focusable="false">
            <circle cx="24" cy="24" r="22" pathLength="1" />
            <path d="M15 24.5l6 6 12-13" pathLength="1" />
          </svg>
        </div>
        <h2 ref={successHeading} tabIndex={-1}>{t.successTitle}</h2>
        <p>{t.successCopy}</p>
        <a className="text-link" href={localePath(locale, 'home')}>{t.successHome} <span aria-hidden="true">↗</span></a>
      </div>
    );
  }

  const describedBy = (field: Field) => errors[field] ? `${field}-error` : undefined;
  const fieldError = (field: Field) => errors[field] && <p id={`${field}-error`} className="contact-field-error">{errors[field]}</p>;

  return (
    <form className="contact-panel contact-form" onSubmit={submit} noValidate aria-busy={state === 'pending'} aria-describedby="contact-use">
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
        <label htmlFor="company">{t.company} <span>{t.optional}</span></label>
        <input id="company" name="company" autoComplete="organization" maxLength={150} />
      </div>
      <div className="contact-field">
        <label htmlFor="message">{t.message}</label>
        <textarea id="message" name="message" required minLength={10} maxLength={4000} rows={5} placeholder={t.placeholder}
          aria-invalid={Boolean(errors.message)} aria-describedby={describedBy('message')}
          onBlur={event => blur('message', event.currentTarget.value)} onInput={event => input('message', event.currentTarget.value)} />
        {fieldError('message')}
      </div>
      <div className="contact-trap" aria-hidden="true">
        <label htmlFor="website">{t.trap}</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p id="contact-use" className="contact-note">{t.use}</p>
      <button className="button contact-submit" type="submit" disabled={state === 'pending'}>
        {state === 'pending' ? t.pendingButton : t.submit}
      </button>
      <p className={state === 'error' ? 'contact-notice contact-notice-error' : 'contact-notice'} role={state === 'error' ? 'alert' : 'status'} aria-live="polite">{notice}</p>
      <noscript>{t.noscript}</noscript>
    </form>
  );
}
