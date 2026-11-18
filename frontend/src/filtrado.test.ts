import { aplicarFiltros, filtrosVacios, resumir, salidaComoNumero } from './filtrado';
import type { Enlace, Figura } from './tipos';
import { fichaVacia } from './tipos';

const enlace = (tienda: string, total: number | null, extra: Partial<Enlace> = {}): Enlace => ({
  id: Math.random(), tiendaId: 1, tienda, confianza: 'FIABLE', url: null, precio: total, envio: 0, total,
  salida: null, pedirAntesDe: null, estado: 'NORMAL', notas: null, precioVisto: null, comprobadoEl: null, ...extra,
});

const figura = (titulo: string, mejorTotal: number | null, extra: Partial<Figura> = {}): Figura => ({
  id: Math.random(), titulo, imagenUrl: null, imagenes: [], nota: null, notas: null, estado: 'PENSANDO_COMPRAR',
  fabricante: null, jan: null, riesgo: null, enlaces: [], mejorEnlaceId: null, mejorTotal, pedirAntesDe: null,
  avisoNoComprar: false, mfcId: null, ficha: fichaVacia, estadoDesde: null, precioPagado: null, ...extra,
});

const coco = figura('Coco 1/6', 232.94, {
  fabricante: 'quesQ', riesgo: 'Alto', pedirAntesDe: '2026-11-27',
  enlaces: [enlace('Xtralife', 232.94, { salida: 'Jul 2027' })],
  ficha: { ...fichaVacia, serie: 'Tongari Boushi no Atelier' },
});
const lucy = figura('Lucy 1/7', 249.9, {
  fabricante: 'Kotobukiya', enlaces: [enlace('Frikanime', 249.9, { salida: 'May 2027', estado: 'RESERVADA' })],
});
const shiro = figura('Shiro 1/7', null, { enlaces: [enlace('Wallapop', null, { salida: 'Disponible' })] });
const todas = [shiro, lucy, coco];
const hoy = new Date('2026-11-17T10:00:00');

describe('filtrado', () => {
  it('entiende las fechas de salida en varios formatos', () => {
    expect(salidaComoNumero('Ene 2028')).toBe(202801);
    expect(salidaComoNumero('Sept 2027')).toBe(202709);
    expect(salidaComoNumero('09/2027')).toBe(202709);
    expect(salidaComoNumero('En stock')).toBeNull();
  });

  it('busca por texto sin importar tildes ni mayúsculas, también en la serie', () => {
    expect(aplicarFiltros(todas, { ...filtrosVacios, texto: 'tongari' }, hoy)).toEqual([coco]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, texto: 'KOTOBUKIYA' }, hoy)).toEqual([lucy]);
  });

  it('filtra por tienda, precio, año de salida, plazo y reservas', () => {
    expect(aplicarFiltros(todas, { ...filtrosVacios, tienda: 'Xtralife' }, hoy)).toEqual([coco]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, precioMax: '240' }, hoy)).toEqual([coco]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, anioSalida: '2027' }, hoy)).toEqual([coco, lucy]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, plazo: '30' }, hoy)).toEqual([coco]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, plazo: '7' }, hoy)).toEqual([]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, soloReservadas: true }, hoy)).toEqual([lucy]);
  });

  it('ordena por precio dejando al final las que no tienen', () => {
    expect(aplicarFiltros(todas, { ...filtrosVacios, orden: 'precio-asc' }, hoy)).toEqual([coco, lucy, shiro]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, orden: 'precio-desc' }, hoy)).toEqual([lucy, coco, shiro]);
    expect(aplicarFiltros(todas, { ...filtrosVacios, orden: 'salida' }, hoy)).toEqual([lucy, coco, shiro]);
  });

  it('si ya se apuntó lo pagado, cuenta eso en vez del mejor precio', () => {
    const tengo = figura('Roy Mustang', null, { estado: 'LA_TENGO', precioPagado: 35 });
    expect(resumir([tengo, coco]).total).toBeCloseTo(267.94);
  });

  it('suma el total y cuenta las que no tienen precio', () => {
    const r = resumir(todas);
    expect(r.cantidad).toBe(3);
    expect(r.total).toBeCloseTo(482.84);
    expect(r.sinPrecio).toBe(1);
  });
});
