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
