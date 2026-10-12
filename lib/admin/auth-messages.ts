export type LoginState = { error?: string; email?: string };
export type LoginNotice = 'inactive' | 'signed-out';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(email: string, password: string): string | null {
  if (!email) return 'Escribe tu correo.';
  if (!EMAIL_PATTERN.test(email)) return 'Escribe un correo válido, por ejemplo ana@devtecia.com.';
  if (!password) return 'Escribe tu contraseña.';
  return null;
}

export function loginErrorMessage(error: { code?: string; status?: number }): string {
  if (error.code === 'invalid_credentials') return 'El correo o la contraseña no coinciden. Revisa los datos e intenta de nuevo.';
  if (error.code === 'email_not_confirmed') return 'Tu correo aún no está confirmado. Pide ayuda a un administrador.';
  if (error.code === 'user_banned') return 'Tu cuenta está desactivada. Pide acceso a un administrador.';
  if (error.status === 429 || error.code === 'over_request_rate_limit') return 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.';
  return 'No pudimos iniciar sesión. Intenta de nuevo en unos minutos.';
}

export const INACTIVE_MESSAGE = 'Tu cuenta está desactivada. Pide acceso a un administrador.';
export const PROFILE_ERROR_MESSAGE = 'No pudimos verificar tu cuenta. Intenta de nuevo en unos minutos.';

export const noticeMessages: Record<LoginNotice, string> = {
  inactive: INACTIVE_MESSAGE,
  'signed-out': 'Cerraste sesión.',
};
