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

export interface DatosParticipante {
  nombre: string;
  rol: string | null;
}

export interface DatosLanzamiento {
  fecha: string | null;
  edicion: string | null;
  precio: number | null;
  moneda: string | null;
  jan: string | null;
}

export interface DatosFicha {
  categoria: string | null;
  serie: string | null;
  personaje: string | null;
  version: string | null;
  escala: string | null;
  alturaMm: number | null;
  pesoG: number | null;
  materiales: string | null;
  avisos: string | null;
  participantes: DatosParticipante[];
  lanzamientos: DatosLanzamiento[];
}

export const fichaVacia: DatosFicha = {
  categoria: null, serie: null, personaje: null, version: null, escala: null, alturaMm: null, pesoG: null,
  materiales: null, avisos: null, participantes: [], lanzamientos: [],
};

export interface Figura {
  id: number;
  titulo: string;
  imagenUrl: string | null;
  imagenes: string[];
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
  mfcId: string | null;
  ficha: DatosFicha;
  /** Desde cuándo está en su estado actual (ISO), según el historial. */
  estadoDesde: string | null;
  /** Lo que costó cuando ya la tengo (puede ser aproximado). */
  precioPagado: number | null;
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
  imagenes: string[];
  nota: number | null;
  notas: string | null;
  fabricante: string | null;
  jan: string | null;
  riesgo: string | null;
  enlaces: EnlacePeticion[];
  mfcId: string | null;
  ficha: DatosFicha;
  precioPagado: number | null;
}

export interface ResultadoImportacion {
  figurasCreadas: number;
  figurasOmitidas: number;
  tiendasCreadas: number;
  avisos: string[];
}

export interface CandidatoMfc {
  mfcId: string;
  titulo: string;
  fabricante: string | null;
  imagenUrl: string | null;
  imagenes: string[] | null;
  jan: string | null;
  ficha: DatosFicha | null;
  sugeridaId: number | null;
  sugeridaTitulo: string | null;
  parecido: number;
  yaImportada: boolean;
}

export interface PrevisualizacionMfc {
  estado: EstadoFigura;
  candidatos: CandidatoMfc[];
}

export type AccionMfc = 'CREAR' | 'FUSIONAR' | 'OMITIR';

export interface DecisionMfc {
  mfcId: string;
  titulo: string;
  fabricante: string | null;
  imagenUrl: string | null;
  imagenes: string[] | null;
  jan: string | null;
  ficha: DatosFicha | null;
  accion: AccionMfc;
  figuraId: number | null;
}

export interface Perfil {
  nombre: string | null;
  avatarUrl: string | null;
  fondoUrl: string | null;
}

export interface Actualizacion {
  figuraId: number;
  titulo: string;
  imagenUrl: string | null;
  anterior: EstadoFigura | null;
  nuevo: EstadoFigura;
  fecha: string;
}

/** Color de cada estado (definido en styles.css). */
export const colorEstado = (estado: EstadoFigura) => `var(--estado-${estado.toLowerCase()})`;
