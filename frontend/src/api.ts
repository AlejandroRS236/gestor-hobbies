import type { EstadoFigura, Figura, FiguraPeticion, ResultadoImportacion, Tienda } from './tipos';

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const esFormulario = opciones.body instanceof FormData;
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: esFormulario ? opciones.headers : { 'Content-Type': 'application/json', ...opciones.headers },
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

export function listarTiendas(): Promise<Tienda[]> {
  return pedir<Tienda[]>('/api/tiendas');
}

export function guardarTienda(tienda: Tienda): Promise<Tienda> {
  return tienda.id === null
    ? pedir<Tienda>('/api/tiendas', { method: 'POST', body: JSON.stringify(tienda) })
    : pedir<Tienda>(`/api/tiendas/${tienda.id}`, { method: 'PUT', body: JSON.stringify(tienda) });
}

export function eliminarTienda(id: number): Promise<void> {
  return pedir<void>(`/api/tiendas/${id}`, { method: 'DELETE' });
}

export function importarExcel(archivo: File): Promise<ResultadoImportacion> {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return pedir<ResultadoImportacion>('/api/importar/excel', { method: 'POST', body: datos });
}
