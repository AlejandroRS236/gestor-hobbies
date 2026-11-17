export type EstadoFigura = 'ME_GUSTA' | 'DUDO' | 'PENSANDO_COMPRAR' | 'RESERVADA' | 'LA_TENGO' | 'DESCARTADA';

export const textoEstado: Record<EstadoFigura, string> = {
  ME_GUSTA: 'Me gusta',
  DUDO: 'Dudo',
  PENSANDO_COMPRAR: 'Pensando comprar',
  RESERVADA: 'Reservada',
  LA_TENGO: 'La tengo',
  DESCARTADA: 'Descartada',
};

export const estados = Object.keys(textoEstado) as EstadoFigura[];

export type EstadoEnlace = 'NORMAL' | 'RESERVADA' | 'DESCARTADA';

export const textoEstadoEnlace: Record<EstadoEnlace, string> = {
  NORMAL: 'Normal',
  RESERVADA: 'Reservada aquí',
  DESCARTADA: 'Descartada',
};

export type Confianza = 'FIABLE' | 'PRECAUCION' | 'NO_COMPRAR';

export const textoConfianza: Record<Confianza, string> = {
  FIABLE: 'Fiable',
  PRECAUCION: 'Con precaución',
  NO_COMPRAR: 'No comprar',
};

export interface Tienda {
  id: number | null;
  nombre: string;
  web: string | null;
  pais: string | null;
  metodosPago: string | null;
  condiciones: string | null;
  envioPorDefecto: number | null;
  confianza: Confianza;
  notas: string | null;
}

export interface Enlace {
  id: number | null;
  tiendaId: number;
  tienda: string;
  confianza: Confianza;
  url: string | null;
  precio: number | null;
  envio: number | null;
  total: number | null;
  salida: string | null;
  pedirAntesDe: string | null;
  estado: EstadoEnlace;
  notas: string | null;
  precioVisto: number | null;
  comprobadoEl: string | null;
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
  riesgo: string | null;
  enlaces: Enlace[];
  mejorEnlaceId: number | null;
  mejorTotal: number | null;
  pedirAntesDe: string | null;
  avisoNoComprar: boolean;
}

export interface EnlacePeticion {
  tiendaId: number;
  url: string | null;
  precio: number | null;
  envio: number | null;
  salida: string | null;
  pedirAntesDe: string | null;
  estado: EstadoEnlace;
  notas: string | null;
  precioVisto: number | null;
  comprobadoEl: string | null;
}

export interface FiguraPeticion {
  titulo: string;
  estado: EstadoFigura;
  imagenUrl: string | null;
  nota: number | null;
  notas: string | null;
  fabricante: string | null;
  jan: string | null;
  riesgo: string | null;
  enlaces: EnlacePeticion[];
}

export interface ResultadoImportacion {
  figurasCreadas: number;
  figurasOmitidas: number;
  tiendasCreadas: number;
  avisos: string[];
}
