import { fireEvent, render, screen } from '@testing-library/react';
import { PestanaImagenes } from './PestanaImagenes';
import { extraerImagenes } from '../api';

vi.mock('../api', () => ({ extraerImagenes: vi.fn() }));

describe('PestanaImagenes', () => {
  const fotos = ['https://img/1.jpg', 'https://img/2.jpg', 'https://img/3.jpg'];

  it('navega por las fotos y permite elegir la principal', () => {
    const onCambiarPrincipal = vi.fn();
    render(<PestanaImagenes titulo="Shiro" imagenes={fotos} principal={fotos[0]}
      onCambiarImagenes={vi.fn()} onCambiarPrincipal={onCambiarPrincipal} />);

    expect(screen.getByAltText('Shiro, foto 1 de 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByAltText('Shiro, foto 2 de 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Usar como principal' }));
    expect(onCambiarPrincipal).toHaveBeenCalledWith(fotos[1]);
  });

  it('añade una foto por enlace y no repite las que ya están', () => {
    const onCambiarImagenes = vi.fn();
    render(<PestanaImagenes titulo="Shiro" imagenes={fotos} principal={fotos[0]}
      onCambiarImagenes={onCambiarImagenes} onCambiarPrincipal={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Enlace de una foto nueva'), { target: { value: fotos[2] } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir foto' }));
    expect(onCambiarImagenes).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Enlace de una foto nueva'), { target: { value: 'https://img/4.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir foto' }));
    expect(onCambiarImagenes).toHaveBeenCalledWith([...fotos, 'https://img/4.jpg']);
  });

  it('saca fotos de una página de tienda y añade solo las marcadas que no estaban', async () => {
    vi.mocked(extraerImagenes).mockResolvedValue([fotos[0], 'https://tienda/a.jpg', 'https://tienda/b.jpg']);
    const onCambiarImagenes = vi.fn();
    const { container } = render(<PestanaImagenes titulo="Coco" imagenes={fotos} principal={fotos[0]}
      onCambiarImagenes={onCambiarImagenes} onCambiarPrincipal={vi.fn()} />);

    const selector = container.querySelector('input[type=file]') as HTMLInputElement;
    const pagina = new File(['<html></html>'], 'coco.html', { type: 'text/html' });
    fireEvent.change(selector, { target: { files: [pagina] } });

    expect(await screen.findByText(/2 de 2 marcadas/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Añadir https://tienda/b.jpg'));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir seleccionadas' }));

    expect(onCambiarImagenes).toHaveBeenCalledWith([...fotos, 'https://tienda/a.jpg']);
  });
});
