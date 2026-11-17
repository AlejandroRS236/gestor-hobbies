import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormularioFigura } from './FormularioFigura';
import type { FiguraPeticion, Tienda } from '../tipos';

const figuya: Tienda = {
  id: 1, nombre: 'Figuya', web: null, pais: null, metodosPago: null, condiciones: null,
  envioPorDefecto: 18.9, confianza: 'FIABLE', notas: null,
};

function renderizar(onGuardar = vi.fn().mockResolvedValue(undefined), onCrearTienda = vi.fn()) {
  render(
    <FormularioFigura
      tiendas={[figuya]}
      estadoInicial="PENSANDO_COMPRAR"
      onGuardar={onGuardar}
      onCrearTienda={onCrearTienda}
      onCancelar={vi.fn()}
    />,
  );
  return onGuardar;
}

describe('FormularioFigura', () => {
  it('no deja guardar sin nombre', async () => {
    const onGuardar = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe el nombre de la figura.');
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('al elegir una tienda rellena su envío habitual y guarda con coma decimal', async () => {
    const onGuardar = renderizar();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '  Guerrera escala 1/7 ' } });
    fireEvent.change(screen.getByLabelText('Nota (0-10)'), { target: { value: '8,7' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir tienda' }));
    fireEvent.change(screen.getByLabelText('Tienda'), { target: { value: '1' } });

    expect(screen.getByLabelText('Envío')).toHaveValue('18,9');

    fireEvent.change(screen.getByLabelText('Enlace'), { target: { value: 'https://figuya.com/x' } });
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '149,90' } });
    fireEvent.change(screen.getByLabelText('Estado en la tienda'), { target: { value: 'RESERVADA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    const datos: FiguraPeticion = onGuardar.mock.calls[0][0];
    expect(datos.titulo).toBe('Guerrera escala 1/7');
    expect(datos.nota).toBe(8.7);
    expect(datos.enlaces).toHaveLength(1);
    expect(datos.enlaces[0]).toMatchObject({
      tiendaId: 1, url: 'https://figuya.com/x', precio: 149.9, envio: 18.9, estado: 'RESERVADA',
    });
  });

  it('guarda la ficha técnica editada en la pestaña Información', async () => {
    const onGuardar = renderizar();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Shiro 1/7' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Información' }));
    fireEvent.change(screen.getByLabelText('Altura (mm)'), { target: { value: '155' } });
    fireEvent.change(screen.getByLabelText('Nº en MyFigureCollection'), { target: { value: '218050' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir empresa o artista' }));
    fireEvent.change(screen.getByLabelText('Nombre del participante'), { target: { value: 'Kotobukiya' } });
    fireEvent.change(screen.getByLabelText('Papel'), { target: { value: 'Fabricante' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    const datos: FiguraPeticion = onGuardar.mock.calls[0][0];
    expect(datos.mfcId).toBe('218050');
    expect(datos.ficha.alturaMm).toBe(155);
    expect(datos.ficha.participantes).toEqual([{ nombre: 'Kotobukiya', rol: 'Fabricante' }]);
  });

  it('pide elegir la tienda de cada fila', async () => {
    const onGuardar = renderizar();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Maga' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir tienda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Elige la tienda de cada fila');
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('permite crear una tienda nueva sin salir del formulario', async () => {
    const nueva: Tienda = { ...figuya, id: 2, nombre: 'Frikanime', envioPorDefecto: null };
    const onCrearTienda = vi.fn().mockResolvedValue(nueva);
    renderizar(undefined, onCrearTienda);
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir tienda' }));
    fireEvent.change(screen.getByLabelText('Tienda'), { target: { value: '__nueva__' } });
    fireEvent.change(screen.getByLabelText('Nombre de la tienda nueva'), { target: { value: 'Frikanime' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear tienda' }));

    await waitFor(() => expect(onCrearTienda).toHaveBeenCalledWith('Frikanime'));
  });
});
