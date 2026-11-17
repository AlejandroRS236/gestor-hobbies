import type { EstadoFigura, Figura } from './tipos';

export async function listarFiguras(estado?: EstadoFigura): Promise<Figura[]> {
  const query = estado ? `?estado=${estado}` : '';
  const respuesta = await fetch(`/api/figuras${query}`);
  if (!respuesta.ok) {
    throw new Error(`No se pudieron cargar las figuras (${respuesta.status})`);
  }
  return respuesta.json();
}
