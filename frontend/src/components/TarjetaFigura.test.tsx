import { render, screen } from '@testing-library/react';
import { TarjetaFigura } from './TarjetaFigura';
import type { Figura } from '../tipos';

const base: Figura = {
  id: 1,
  titulo: 'Guerrera escala 1/7',
  imagenUrl: null,
  nota: 8.7,
  notas: null,
  estado: 'PENSANDO_COMPRAR',
  fabricante: null,
  jan: null,
  fechaSalida: null,
  pedirAntesDe: '2026-11-20',
  metodoPago: null,
  riesgo: null,
  enlaces: [
    { id: 1, tienda: 'Figuya', url: 'https://figuya.com/x', precio: 149.9, envio: 9, total: 158.9 },
    { id: 2, tienda: 'Japan&Co', url: 'https://japanandco.example/x', precio: 155, envio: 0, total: 155 },
  ],
  mejorTotal: 155,
};

describe('TarjetaFigura', () => {
  it('muestra el título, el estado y la tienda más barata', () => {
    render(<TarjetaFigura figura={base} />);

    expect(screen.getByRole('heading', { name: 'Guerrera escala 1/7' })).toBeInTheDocument();
    expect(screen.getByText('Pensando comprar')).toBeInTheDocument();
    expect(screen.getByText('Japan&Co')).toBeInTheDocument();
    expect(screen.getByText('2 tiendas')).toBeInTheDocument();
  });

  it('muestra la nota con decimales', () => {
    render(<TarjetaFigura figura={base} />);
    expect(screen.getByText('8,7')).toBeInTheDocument();
  });

  it('no muestra precio si ningún enlace lo tiene', () => {
    render(<TarjetaFigura figura={{ ...base, enlaces: [], mejorTotal: null }} />);
    expect(screen.queryByText('Figuya')).not.toBeInTheDocument();
  });
});
