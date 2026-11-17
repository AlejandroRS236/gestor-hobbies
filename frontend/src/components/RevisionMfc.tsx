import { useState } from 'react';
import type { CandidatoMfc, DecisionMfc, EstadoFigura, Figura, PrevisualizacionMfc } from '../tipos';
import { textoEstado } from '../tipos';

/** Una decisión junto con el estado que tendrá la figura si se crea nueva. */
export interface DecisionConEstado {
  estado: EstadoFigura;
  decision: DecisionMfc;
}

interface Props {
  /** Una previsualización por archivo importado. */
  vistas: PrevisualizacionMfc[];
  figuras: Figura[];
  onConfirmar: (decisiones: DecisionConEstado[]) => Promise<void>;
  onCancelar: () => void;
}

/**
 * Valor del desplegable: "crear", "omitir" o "f:<id>" para fusionar con esa figura.
 * Si ya estaba importada pero ahora viene la página de la figura (con ficha y
 * galería), se propone completarla en vez de omitirla.
 */
function valorInicial(c: CandidatoMfc) {
  if (c.yaImportada && !c.ficha) return 'omitir';
  return c.sugeridaId !== null ? `f:${c.sugeridaId}` : 'crear';
}

/** Junta los candidatos de todos los archivos, sin repetir figuras de MFC. */
function juntar(vistas: PrevisualizacionMfc[]) {
  const vistos = new Map<string, { candidato: CandidatoMfc; estado: EstadoFigura }>();
  for (const vista of vistas) {
    for (const c of vista.candidatos) {
      const anterior = vistos.get(c.mfcId);
      // Si la misma figura viene en una lista y en su propia página, gana la página (trae la ficha).
      if (!anterior || (!anterior.candidato.ficha && c.ficha)) {
        vistos.set(c.mfcId, { candidato: c, estado: anterior?.estado ?? vista.estado });
      }
    }
  }
  return [...vistos.values()];
}

function aDecision(c: CandidatoMfc, valor: string): DecisionMfc {
  const base = {
    mfcId: c.mfcId, titulo: c.titulo, fabricante: c.fabricante, imagenUrl: c.imagenUrl, imagenes: c.imagenes, jan: c.jan,
    ficha: c.ficha,
  };
  if (valor === 'crear') return { ...base, accion: 'CREAR', figuraId: null };
  if (valor === 'omitir') return { ...base, accion: 'OMITIR', figuraId: null };
  return { ...base, accion: 'FUSIONAR', figuraId: Number(valor.slice(2)) };
}

export function RevisionMfc({ vistas, figuras, onConfirmar, onCancelar }: Props) {
  const [filas] = useState(() => juntar(vistas));
  const [valores, setValores] = useState<string[]>(filas.map((f) => valorInicial(f.candidato)));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ordenadas = [...figuras].sort((a, b) => a.titulo.localeCompare(b.titulo));

  const nuevas = valores.filter((v) => v === 'crear').length;
  const fusiones = valores.filter((v) => v.startsWith('f:')).length;

  async function confirmar() {
    setGuardando(true);
    try {
      await onConfirmar(filas.map((f, i) => ({ estado: f.estado, decision: aDecision(f.candidato, valores[i]) })));
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  return (
    <div className="fondo-modal" onClick={onCancelar}>
      <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()} role="dialog"
        aria-label="Revisar importación de MyFigureCollection">
        <h2>Revisar importación de MyFigureCollection</h2>
        <p className="pista">
          Si una figura ya la tienes (aunque sea con otro nombre), elígela y se completará con las fotos, la ficha y
          el enlace de MFC sin tocar tus datos de compra. Las nuevas entran en el estado que se indica en cada una.
        </p>

        <ul className="lista-revision">
          {filas.map(({ candidato: c, estado }, i) => (
            <li key={c.mfcId}>
              <div className="miniatura">{c.imagenUrl && <img src={c.imagenUrl} alt="" referrerPolicy="no-referrer" />}</div>
              <div className="datos-revision">
                <span className="nombre-tienda">{c.titulo}</span>
                <span className="dato">
                  {c.fabricante}
                  {valores[i] === 'crear' && ` · entrará en ${textoEstado[estado]}`}
                  {c.ficha && ' · con ficha técnica'}
                  {c.imagenes && c.imagenes.length > 1 && ` · ${c.imagenes.length} fotos`}
                  {c.yaImportada && ' · ya importada antes'}
                  {!c.yaImportada && c.sugeridaId !== null && ` · parecido ${Math.round(c.parecido * 100)} %`}
                </span>
              </div>
              <select
                aria-label={`Qué hacer con ${c.titulo}`}
                value={valores[i]}
                onChange={(e) => setValores((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
              >
                <option value="crear">Crear como nueva</option>
                <option value="omitir">No importar</option>
                <optgroup label="Es la misma que…">
                  {ordenadas.map((f) => (
                    <option key={f.id} value={`f:${f.id}`}>
                      {f.titulo}
                    </option>
                  ))}
                </optgroup>
              </select>
            </li>
          ))}
        </ul>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="acciones">
          <span className="pista">
            {nuevas} nuevas · {fusiones} se completarán · {valores.length - nuevas - fusiones} sin importar
          </span>
          <span className="espacio" />
          <button type="button" className="secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="principal" onClick={confirmar} disabled={guardando}>
            {guardando ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
