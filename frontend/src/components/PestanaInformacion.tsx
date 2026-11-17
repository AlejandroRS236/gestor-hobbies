import type { DatosFicha, DatosLanzamiento, DatosParticipante } from '../tipos';

interface Props {
  ficha: DatosFicha;
  mfcId: string;
  onCambiarFicha: (ficha: DatosFicha) => void;
  onCambiarMfcId: (valor: string) => void;
}

const aTextoONull = (v: string) => (v.trim() === '' ? null : v);
const aEnteroONull = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};
const aNumeroONull = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || Number.isNaN(n) ? null : n;
};

/** Pestaña "Información": la ficha técnica de la figura, al estilo de MyFigureCollection. */
export function PestanaInformacion({ ficha, mfcId, onCambiarFicha, onCambiarMfcId }: Props) {
  const campo = (clave: keyof DatosFicha, valor: unknown) => onCambiarFicha({ ...ficha, [clave]: valor });

  const cambiarParticipante = (i: number, cambios: Partial<DatosParticipante>) =>
    campo('participantes', ficha.participantes.map((p, j) => (j === i ? { ...p, ...cambios } : p)));
  const cambiarLanzamiento = (i: number, cambios: Partial<DatosLanzamiento>) =>
    campo('lanzamientos', ficha.lanzamientos.map((l, j) => (j === i ? { ...l, ...cambios } : l)));

  const texto = (clave: keyof DatosFicha, etiqueta: string, clase = '') => (
    <label className={clase}>
      {etiqueta}
      <input value={(ficha[clave] as string | null) ?? ''} onChange={(e) => campo(clave, aTextoONull(e.target.value))} />
    </label>
  );

  return (
    <div>
      {ficha.avisos && <p className="aviso aviso-grande">{ficha.avisos}</p>}

      <div className="campos">
        {texto('serie', 'Serie / obra', 'doble')}
        {texto('personaje', 'Personaje')}
        {texto('version', 'Versión')}
        {texto('categoria', 'Categoría')}
        {texto('escala', 'Escala')}
        <label>
          Altura (mm)
          <input inputMode="numeric" value={ficha.alturaMm ?? ''}
            onChange={(e) => campo('alturaMm', aEnteroONull(e.target.value))} />
        </label>
        <label>
          Peso (g)
          <input inputMode="numeric" value={ficha.pesoG ?? ''}
            onChange={(e) => campo('pesoG', aEnteroONull(e.target.value))} />
        </label>
        {texto('materiales', 'Materiales')}
        <label className="doble">
          Avisos
          <input value={ficha.avisos ?? ''} onChange={(e) => campo('avisos', aTextoONull(e.target.value))}
            placeholder="Existen falsificaciones, piezas frágiles..." />
        </label>
        <label>
          Nº en MyFigureCollection
          <input inputMode="numeric" value={mfcId} onChange={(e) => onCambiarMfcId(e.target.value)} />
        </label>
      </div>
      {mfcId.trim() !== '' && (
        <p className="pista">
          <a href={`https://myfigurecollection.net/item/${mfcId.trim()}`} target="_blank" rel="noreferrer">
            Ver en MyFigureCollection
          </a>
        </p>
      )}

      <h3>Empresas y artistas</h3>
      {ficha.participantes.map((p, i) => (
        <div className="fila-doble" key={i}>
          <input aria-label="Nombre del participante" placeholder="Nombre" value={p.nombre}
            onChange={(e) => cambiarParticipante(i, { nombre: e.target.value })} />
          <input aria-label="Papel" placeholder="Fabricante, escultor, pintor..." value={p.rol ?? ''}
            onChange={(e) => cambiarParticipante(i, { rol: aTextoONull(e.target.value) })} />
          <button type="button" className="secundario" aria-label="Quitar participante"
            onClick={() => campo('participantes', ficha.participantes.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="secundario"
        onClick={() => campo('participantes', [...ficha.participantes, { nombre: '', rol: null }])}>
        + Añadir empresa o artista
      </button>

      <h3>Lanzamientos</h3>
      {ficha.lanzamientos.map((l, i) => (
        <div className="fila-lanzamiento" key={i}>
          <input aria-label="Fecha" placeholder="09/2027" value={l.fecha ?? ''}
            onChange={(e) => cambiarLanzamiento(i, { fecha: aTextoONull(e.target.value) })} />
          <input aria-label="Edición" placeholder="Standard (Japan)" value={l.edicion ?? ''}
            onChange={(e) => cambiarLanzamiento(i, { edicion: aTextoONull(e.target.value) })} />
          <input aria-label="Precio oficial" placeholder="Precio" inputMode="decimal" value={l.precio ?? ''}
            onChange={(e) => cambiarLanzamiento(i, { precio: aNumeroONull(e.target.value) })} />
          <input aria-label="Moneda" placeholder="JPY" value={l.moneda ?? ''} maxLength={3}
            onChange={(e) => cambiarLanzamiento(i, { moneda: aTextoONull(e.target.value.toUpperCase()) })} />
          <input aria-label="JAN del lanzamiento" placeholder="JAN" value={l.jan ?? ''}
            onChange={(e) => cambiarLanzamiento(i, { jan: aTextoONull(e.target.value) })} />
          <button type="button" className="secundario" aria-label="Quitar lanzamiento"
            onClick={() => campo('lanzamientos', ficha.lanzamientos.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="secundario"
        onClick={() => campo('lanzamientos', [...ficha.lanzamientos,
          { fecha: null, edicion: null, precio: null, moneda: null, jan: null }])}>
        + Añadir lanzamiento
      </button>
    </div>
  );
}
