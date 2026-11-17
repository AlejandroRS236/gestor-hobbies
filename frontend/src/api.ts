import type { EstadoFigura, Figura, FiguraPeticion } from './tipos';

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...opciones.headers },
  });
  if (!respuesta.ok) {
    let detalle = `Error ${respuesta.status}`;
    try {
      const problema = await respuesta.json();
      if (problema?.detail) detalle = problema.detail;
    } catch {
      // La respuesta no traía JSON; nos quedamos con el código.
    }
    throw new Error(detalle);
  }
  return respuesta.status === 204 ? (undefined as T) : respuesta.json();
}

export function listarFiguras(estado?: EstadoFigura): Promise<Figura[]> {
  const query = estado ? `?estado=${estado}` : '';
  return pedir<Figura[]>(`/api/figuras${query}`);
}

export function crearFigura(datos: FiguraPeticion): Promise<Figura> {
  return pedir<Figura>('/api/figuras', { method: 'POST', body: JSON.stringify(datos) });
}

export function actualizarFigura(id: number, datos: FiguraPeticion): Promise<Figura> {
  return pedir<Figura>(`/api/figuras/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export function eliminarFigura(id: number): Promise<void> {
  return pedir<void>(`/api/figuras/${id}`, { method: 'DELETE' });
}
