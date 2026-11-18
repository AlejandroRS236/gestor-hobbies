import type { EstadoFigura, Figura } from './tipos';

/** El precio que cuenta: lo pagado si ya se apuntó, si no el mejor precio con envío. */
export const precioDe = (f: Figura) => f.precioPagado ?? f.mejorTotal;

export type Orden = 'nombre' | 'precio-asc' | 'precio-desc' | 'limite' | 'salida';
export type Plazo = 'todos' | '7' | '30' | 'con-fecha';

export interface Filtros {
  texto: string;
  tienda: string;
  fabricante: string;
  serie: string;
  riesgo: string;
  anioSalida: string;
  precioMin: string;
  precioMax: string;
  plazo: Plazo;
  soloReservadas: boolean;
  orden: Orden;
}

export const filtrosVacios: Filtros = {
  texto: '', tienda: '', fabricante: '', serie: '', riesgo: '', anioSalida: '',
  precioMin: '', precioMax: '', plazo: 'todos', soloReservadas: false, orden: 'nombre',
};

const MESES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
  jan: 1, apr: 4, aug: 8, dec: 12,
};

const normalizar = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Fecha de salida aproximada como número AAAAMM, para ordenar y filtrar por año.
 * Entiende "Ene 2028", "Sept 2027", "09/2027", "12/15/2023"... Si no hay año, null.
 */
export function salidaComoNumero(texto: string | null | undefined): number | null {
  if (!texto) return null;
  const anio = texto.match(/\b(20\d{2})\b/);
  if (!anio) return null;
  const numerico = texto.match(/^(\d{1,2})\//);
  const palabra = normalizar(texto).match(/^([a-z]+)/);
  const mes = numerico ? Number(numerico[1]) : palabra ? (MESES[palabra[1]] ?? 0) : 0;
  return Number(anio[1]) * 100 + mes;
}

/** La salida que mejor representa a la figura: la de su tienda más barata o, si no, la primera conocida. */
export function salidaDe(f: Figura): number | null {
  const mejor = f.enlaces.find((e) => e.id === f.mejorEnlaceId);
  const candidatas = [mejor?.salida, ...f.enlaces.map((e) => e.salida), ...f.ficha.lanzamientos.map((l) => l.fecha)];
  for (const c of candidatas) {
    const n = salidaComoNumero(c);
    if (n !== null) return n;
  }
  return null;
}

const diasHasta = (iso: string, hoy: Date) =>
  Math.floor((new Date(`${iso}T00:00:00`).getTime() - new Date(hoy.toDateString()).getTime()) / 86_400_000);

export function aplicarFiltros(figuras: Figura[], f: Filtros, hoy = new Date()): Figura[] {
  const texto = normalizar(f.texto.trim());
  const min = f.precioMin.trim() === '' ? null : Number(f.precioMin.replace(',', '.'));
  const max = f.precioMax.trim() === '' ? null : Number(f.precioMax.replace(',', '.'));

  const filtradas = figuras.filter((fig) => {
    if (texto) {
      const donde = [fig.titulo, fig.fabricante, fig.ficha.serie, fig.ficha.personaje, fig.notas]
        .filter(Boolean).join(' ');
      if (!normalizar(donde).includes(texto)) return false;
    }
    if (f.tienda && !fig.enlaces.some((e) => e.tienda === f.tienda)) return false;
    if (f.fabricante && fig.fabricante !== f.fabricante) return false;
    if (f.serie && fig.ficha.serie !== f.serie) return false;
    if (f.riesgo && (fig.riesgo ?? '').toLowerCase() !== f.riesgo.toLowerCase()) return false;
    if (f.anioSalida) {
      const salida = salidaDe(fig);
      if (salida === null || Math.floor(salida / 100) !== Number(f.anioSalida)) return false;
    }
    if (min !== null && !Number.isNaN(min) && (precioDe(fig) === null || precioDe(fig)! < min)) return false;
    if (max !== null && !Number.isNaN(max) && (precioDe(fig) === null || precioDe(fig)! > max)) return false;
    if (f.plazo !== 'todos') {
      if (!fig.pedirAntesDe) return false;
      if (f.plazo !== 'con-fecha') {
        const dias = diasHasta(fig.pedirAntesDe, hoy);
        if (dias < 0 || dias > Number(f.plazo)) return false;
      }
    }
    if (f.soloReservadas && !fig.enlaces.some((e) => e.estado === 'RESERVADA')) return false;
    return true;
  });

  const alFinal = (v: number | null, asc: boolean) => (v === null ? (asc ? Infinity : -Infinity) : v);
  const comparadores: Record<Orden, (a: Figura, b: Figura) => number> = {
    nombre: (a, b) => a.titulo.localeCompare(b.titulo),
    'precio-asc': (a, b) => alFinal(precioDe(a), true) - alFinal(precioDe(b), true),
    'precio-desc': (a, b) => alFinal(precioDe(b), false) - alFinal(precioDe(a), false),
    limite: (a, b) => (a.pedirAntesDe ?? '9999').localeCompare(b.pedirAntesDe ?? '9999'),
    salida: (a, b) => alFinal(salidaDe(a), true) - alFinal(salidaDe(b), true),
  };
  return [...filtradas].sort((a, b) => comparadores[f.orden](a, b) || a.titulo.localeCompare(b.titulo));
}

/** Valores distintos de un campo, ordenados, para rellenar los desplegables. */
export function opciones(figuras: Figura[], campo: (f: Figura) => (string | null | undefined)[]): string[] {
  const valores = new Set<string>();
  figuras.forEach((f) => campo(f).forEach((v) => v && valores.add(v)));
  return [...valores].sort((a, b) => a.localeCompare(b));
}

export interface Resumen {
  cantidad: number;
  total: number;
  sinPrecio: number;
}

/** Suma del precio de cada figura (lo pagado o, si no, el mejor precio con envío). */
export function resumir(figuras: Figura[]): Resumen {
  return figuras.reduce<Resumen>(
    (r, f) => (precioDe(f) === null
      ? { ...r, cantidad: r.cantidad + 1, sinPrecio: r.sinPrecio + 1 }
      : { ...r, cantidad: r.cantidad + 1, total: r.total + precioDe(f)! }),
    { cantidad: 0, total: 0, sinPrecio: 0 },
  );
}

export const hayFiltros = (f: Filtros) =>
  JSON.stringify({ ...f, orden: 'nombre' }) !== JSON.stringify({ ...filtrosVacios, orden: 'nombre' });

export function porEstado(figuras: Figura[], estado: EstadoFigura | 'TODAS') {
  return estado === 'TODAS' ? figuras : figuras.filter((f) => f.estado === estado);
}
