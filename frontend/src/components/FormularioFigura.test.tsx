import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormularioFigura } from './FormularioFigura';
import type { FiguraPeticion } from '../tipos';

function renderizar(onGuardar = vi.fn().mockResolvedValue(undefined)) {
  render(<FormularioFigura estadoInicial="PENSANDO_COMPRAR" onGuardar={onGuardar} onCancelar={vi.fn()} />);
  return onGuardar;
}

describe('FormularioFigura', () => {
  it('no deja guardar sin nombre', async () => {
    const onGuardar = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe el nombre de la figura.');
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('guarda la figura con sus tiendas, admitiendo coma decimal', async () => {
    const onGuardar = renderizar();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '  Guerrera escala 1/7 ' } });
    fireEvent.change(screen.getByLabelText('Nota (0-10)'), { target: { value: '8,7' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir tienda' }));
    fireEvent.change(screen.getByLabelText('Tienda'), { target: { value: 'Figuya' } });
    fireEvent.change(screen.getByLabelText('Enlace'), { target: { value: 'https://figuya.com/x' } });
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '149,90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    const datos: FiguraPeticion = onGuardar.mock.calls[0][0];
    expect(datos.titulo).toBe('Guerrera escala 1/7');
    expect(datos.estado).toBe('PENSANDO_COMPRAR');
    expect(datos.nota).toBe(8.7);
    expect(datos.enlaces).toEqual([{ tienda: 'Figuya', url: 'https://figuya.com/x', precio: 149.9, envio: null }]);
  });

  it('pide nombre y enlace en cada tienda', async () => {
    const onGuardar = renderizar();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Maga' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir tienda' }));
    fireEvent.change(screen.getByLabelText('Tienda'), { target: { value: 'Figuya' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cada tienda necesita nombre y enlace.');
    expect(onGuardar).not.toHaveBeenCalled();
  });
});
