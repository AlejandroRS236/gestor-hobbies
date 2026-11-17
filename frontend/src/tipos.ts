export type EstadoFigura = 'ME_GUSTA' | 'PENSANDO_COMPRAR' | 'RESERVADA' | 'LA_TENGO' | 'DESCARTADA';

export const textoEstado: Record<EstadoFigura, string> = {
  ME_GUSTA: 'Me gusta',
  PENSANDO_COMPRAR: 'Pensando comprar',
  RESERVADA: 'Reservada',
  LA_TENGO: 'La tengo',
  DESCARTADA: 'Descartada',
};

export const estados = Object.keys(textoEstado) as EstadoFigura[];

export interface Enlace {
  id: number | null;
  tienda: string;
  url: string;
  precio: number | null;
  envio: number | null;
  total: number | null;
}

export interface Figura {
  id: number;
  titulo: string;
  imagenUrl: string | null;
  nota: number | null;
  notas: string | null;
  estado: EstadoFigura;
  fabricante: string | null;
  jan: string | null;
  fechaSalida: string | null;
  pedirAntesDe: string | null;
  metodoPago: string | null;
  riesgo: string | null;
  enlaces: Enlace[];
  mejorTotal: number | null;
}
