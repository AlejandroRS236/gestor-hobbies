import { fireEvent, render, screen, within } from '@testing-library/react';
import { PerfilFiguras } from './PerfilFiguras';
import type { Figura } from '../tipos';
import { fichaVacia } from '../tipos';

const figura = (id: number, titulo: string, extra: Partial<Figura> = {}): Figura => ({
  id, titulo, imagenUrl: null, imagenes: [], nota: null, notas: null, estado: 'ME_GUSTA', fabricante: null, jan: null,
  riesgo: null, enlaces: [], mejorEnlaceId: null, mejorTotal: null, pedirAntesDe: null, avisoNoComprar: false,
  mfcId: null, ficha: fichaVacia, estadoDesde: null, precioPagado: null, ...extra,
});

const figuras = [
  figura(1, 'Roy Mustang', { estado: 'LA_TENGO', estadoDesde: '2026-11-10T10:00:00Z', fabricante: 'Good Smile Company' }),
  figura(2, 'Frieren', { estado: 'LA_TENGO', estadoDesde: '2026-11-17T10:00:00Z', fabricante: 'Taito' }),
  figura(3, 'Nami', { estado: 'RESERVADA', mejorTotal: 203.89, fabricante: 'Good Smile Company' }),
  figura(4, 'Coco 1/6', { estado: 'PENSANDO_COMPRAR', mejorTotal: 232.94, pedirAntesDe: '2099-01-01' }),
];

function renderizar(onVerLista = vi.fn(), onAbrirFigura = vi.fn()) {
  render(
    <PerfilFiguras
      figuras={figuras}
      actualizaciones={[{ figuraId: 3, titulo: 'Nami', imagenUrl: null, anterior: 'PENSANDO_COMPRAR', nuevo: 'RESERVADA',
        fecha: '2026-11-16T21:40:00Z' }]}
      perfil={{ nombre: 'Alejandro', avatarUrl: null, fondoUrl: null }}
      onVerLista={onVerLista}
      onAbrirFigura={onAbrirFigura}
      onCambiarFondo={vi.fn()}
    />,
  );
}

describe('PerfilFiguras', () => {
  it('pone primero en el escaparate la última figura conseguida', () => {
    renderizar();
    const escaparate = screen.getByText('Últimas conseguidas').parentElement!;
    const portadas = within(escaparate).getAllByRole('button');
    expect(portadas.map((p) => p.getAttribute('aria-label'))).toEqual(['Frieren', 'Roy Mustang']);
  });

  it('muestra el reparto por estados con su porcentaje y lleva a la lista filtrada', () => {
    const onVerLista = vi.fn();
    renderizar(onVerLista);
    expect(screen.getAllByText('50 %')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reservada' }));
    expect(onVerLista).toHaveBeenCalledWith('RESERVADA');
    fireEvent.click(screen.getByRole('button', { name: 'Ver lista completa' }));
    expect(onVerLista).toHaveBeenCalledWith('TODAS');
  });

  it('enseña totales, fabricante favorito y las últimas actualizaciones', () => {
    const onAbrirFigura = vi.fn();
    renderizar(undefined, onAbrirFigura);
    expect(screen.getByText('Good Smile Company')).toBeInTheDocument();
    expect(screen.getAllByText(/203,89/).length).toBeGreaterThan(0);
    const botonesNami = screen.getAllByRole('button', { name: 'Nami' });
    expect(botonesNami).toHaveLength(2); // su portada en Reservadas y su línea en Últimas actualizaciones
    fireEvent.click(botonesNami[1]);
    expect(onAbrirFigura).toHaveBeenCalledWith(figuras[2]);
  });
});
