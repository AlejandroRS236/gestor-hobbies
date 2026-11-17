import { fireEvent, render, screen } from '@testing-library/react';
import { TarjetaFigura } from './TarjetaFigura';
import type { Enlace, Figura } from '../tipos';
import { fichaVacia } from '../tipos';

const enlace = (id: number, tienda: string, total: number, extra: Partial<Enlace> = {}): Enlace => ({
  id, tiendaId: id, tienda, confianza: 'FIABLE', url: null, precio: total, envio: 0, total,
  salida: null, pedirAntesDe: null, estado: 'NORMAL', notas: null, precioVisto: null, comprobadoEl: null,
  ...extra,
});

const base: Figura = {
  id: 1,
  titulo: 'Guerrera escala 1/7',
  imagenUrl: null,
  imagenes: [],
  nota: 8.7,
  notas: null,
  estado: 'PENSANDO_COMPRAR',
  fabricante: null,
  jan: null,
  riesgo: null,
  enlaces: [enlace(1, 'Figuya', 158.9, { estado: 'RESERVADA' }), enlace(2, 'Japan&Co', 155)],
  mejorEnlaceId: 2,
  mejorTotal: 155,
  pedirAntesDe: '2026-11-20',
  avisoNoComprar: false,
  mfcId: null,
  ficha: fichaVacia,
};

describe('TarjetaFigura', () => {
  it('muestra el título, el estado y la tienda más barata', () => {
    render(<TarjetaFigura figura={base} />);

    expect(screen.getByRole('heading', { name: 'Guerrera escala 1/7' })).toBeInTheDocument();
    expect(screen.getByText('Pensando comprar')).toBeInTheDocument();
    expect(screen.getByText('Japan&Co')).toBeInTheDocument();
    expect(screen.getByText('2 tiendas')).toBeInTheDocument();
  });

  it('indica dónde está reservada y la nota con decimales', () => {
    render(<TarjetaFigura figura={base} />);
    expect(screen.getByText('Reservada en Figuya')).toBeInTheDocument();
    expect(screen.getByText('8,7')).toBeInTheDocument();
  });

  it('avisa si MFC indica que existen falsificaciones', () => {
    const ficha = { ...fichaVacia, avisos: 'Warning: a counterfeit version of this item exists.' };
    render(<TarjetaFigura figura={{ ...base, ficha }} />);
    expect(screen.getByText('Existen falsificaciones de esta figura')).toBeInTheDocument();
  });

  it('si la imagen no carga muestra un hueco en vez del texto alternativo', () => {
    render(<TarjetaFigura figura={{ ...base, imagenUrl: 'https://img/rota.jpg' }} />);
    const imagen = screen.getByAltText('Guerrera escala 1/7');
    expect(imagen).toHaveAttribute('referrerpolicy', 'no-referrer');

    fireEvent.error(imagen);
    expect(screen.queryByAltText('Guerrera escala 1/7')).not.toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('avisa si alguna tienda está marcada como no comprar', () => {
    render(<TarjetaFigura figura={{ ...base, avisoNoComprar: true }} />);
    expect(screen.getByText(/no comprar/)).toBeInTheDocument();
  });
});
