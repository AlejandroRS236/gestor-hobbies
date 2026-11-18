import type {
  Actualizacion, Perfil, DecisionMfc, EstadoFigura, Figura, FiguraPeticion, PrevisualizacionMfc, ResultadoImportacion, Tienda,
} from './tipos';

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

/** Lee una pestaña de colección de MFC guardada (.html) y sugiere coincidencias sin guardar nada. */
export function previsualizarMfc(archivo: File): Promise<PrevisualizacionMfc> {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return pedir<PrevisualizacionMfc>('/api/importar/mfc/previsualizar', { method: 'POST', body: datos });
}

export function aplicarMfc(estado: EstadoFigura, decisiones: DecisionMfc[]): Promise<ResultadoImportacion> {
  return pedir<ResultadoImportacion>('/api/importar/mfc', {
    method: 'POST',
    body: JSON.stringify({ estado, decisiones }),
  });
}

/** Fotos de producto de una página de tienda guardada (.html), para elegir cuáles añadir a la galería. */
export function extraerImagenes(archivo: File): Promise<string[]> {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return pedir<string[]>('/api/importar/imagenes', { method: 'POST', body: datos });
}

export function obtenerPerfil(): Promise<Perfil> {
  return pedir<Perfil>('/api/perfil');
}

export function guardarPerfil(perfil: Perfil): Promise<Perfil> {
  return pedir<Perfil>('/api/perfil', { method: 'PUT', body: JSON.stringify(perfil) });
}

export function ultimasActualizaciones(limite = 8): Promise<Actualizacion[]> {
  return pedir<Actualizacion[]>(`/api/historial?limite=${limite}`);
}
