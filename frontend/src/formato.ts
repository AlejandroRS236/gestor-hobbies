const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const fecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatearEuros = (valor: number) => euros.format(valor);

export const formatearFecha = (iso: string) => fecha.format(new Date(`${iso}T00:00:00`));

export const formatearNota = (nota: number) => nota.toLocaleString('es-ES', { minimumFractionDigits: 1 });

/** Campos de formulario: texto vacío ↔ null. */
export const texto = (v: string | null | undefined) => v ?? '';
export const numeroATexto = (v: number | null | undefined) =>
  v === null || v === undefined ? '' : String(v).replace('.', ',');
export const aTexto = (v: string) => (v.trim() === '' ? null : v.trim());
export const aNumero = (v: string) => (v.trim() === '' ? null : Number(v.trim().replace(',', '.')));

/** Días que faltan hasta una fecha ISO (negativo si ya pasó). */
export function diasHasta(iso: string, hoy = new Date()) {
  const dia = new Date(`${iso}T00:00:00`).getTime();
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  return Math.round((dia - base) / 86_400_000);
}

/** "en 9 días", "mañana", "hoy" o la fecha si queda lejos. */
export function textoPlazo(iso: string, hoy = new Date()) {
  const dias = diasHasta(iso, hoy);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias > 1 && dias <= 30) return `en ${dias} días`;
  return formatearFecha(iso);
}

const fechaHora = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "Hoy, 12:05", "Ayer, 21:40" o "16 nov, 22:08". */
export function formatearMomento(iso: string, ahora = new Date()) {
  const fecha = new Date(iso);
  const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dias = diasHasta(iso.slice(0, 10), ahora);
  if (fecha.toDateString() === ahora.toDateString()) return `Hoy, ${hora}`;
  if (dias === -1) return `Ayer, ${hora}`;
  return fechaHora.format(fecha);
}
