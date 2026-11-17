import { fireEvent, render, screen } from '@testing-library/react';
import { PestanaImagenes } from './PestanaImagenes';

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
});
