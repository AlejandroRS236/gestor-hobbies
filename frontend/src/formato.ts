const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const fecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatearEuros = (valor: number) => euros.format(valor);

export const formatearFecha = (iso: string) => fecha.format(new Date(`${iso}T00:00:00`));

export const formatearNota = (nota: number) => nota.toLocaleString('es-ES', { minimumFractionDigits: 1 });
