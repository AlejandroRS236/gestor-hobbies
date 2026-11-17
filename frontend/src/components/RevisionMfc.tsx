import { useState } from 'react';
import type { CandidatoMfc, DecisionMfc, Figura, PrevisualizacionMfc } from '../tipos';
import { textoEstado } from '../tipos';

interface Props {
  vista: PrevisualizacionMfc;
  figuras: Figura[];
  onConfirmar: (decisiones: DecisionMfc[]) => Promise<void>;
  onCancelar: () => void;
}

/** Valor del desplegable: "crear", "omitir" o "f:<id>" para fusionar con esa figura. */
function valorInicial(c: CandidatoMfc) {
  if (c.yaImportada) return 'omitir';
  return c.sugeridaId !== null ? `f:${c.sugeridaId}` : 'crear';
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

export function RevisionMfc({ vista, figuras, onConfirmar, onCancelar }: Props) {
  const [valores, setValores] = useState<string[]>(vista.candidatos.map(valorInicial));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ordenadas = [...figuras].sort((a, b) => a.titulo.localeCompare(b.titulo));

  const nuevas = valores.filter((v) => v === 'crear').length;
  const fusiones = valores.filter((v) => v.startsWith('f:')).length;

  async function confirmar() {
    setGuardando(true);
    try {
      await onConfirmar(vista.candidatos.map((c, i) => aDecision(c, valores[i])));
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
          Las figuras nuevas entrarán en <strong>{textoEstado[vista.estado]}</strong>. Si una ya la tienes con otro
          nombre, elígela y solo se le añadirán la foto y el enlace de MFC.
        </p>

        <ul className="lista-revision">
          {vista.candidatos.map((c, i) => (
            <li key={c.mfcId}>
              <div className="miniatura">{c.imagenUrl && <img src={c.imagenUrl} alt="" />}</div>
              <div className="datos-revision">
                <span className="nombre-tienda">{c.titulo}</span>
                <span className="dato">
                  {c.fabricante}
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
