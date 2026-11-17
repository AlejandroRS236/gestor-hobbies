import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { extraerImagenes } from '../api';

interface Props {
  titulo: string;
  imagenes: string[];
  principal: string;
  onCambiarImagenes: (imagenes: string[]) => void;
  onCambiarPrincipal: (url: string) => void;
}

/** Galería de la figura: ver todas las fotos en grande, elegir la principal, añadir y quitar. */
export function PestanaImagenes({ titulo, imagenes, principal, onCambiarImagenes, onCambiarPrincipal }: Props) {
  // La principal se muestra siempre, aunque no esté en la galería.
  const todas = principal && !imagenes.includes(principal) ? [principal, ...imagenes] : imagenes;
  const [actual, setActual] = useState(Math.max(0, todas.indexOf(principal)));
  const [nueva, setNueva] = useState('');
  const [encontradas, setEncontradas] = useState<string[] | null>(null);
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [estadoTienda, setEstadoTienda] = useState<string | null>(null);
  const selector = useRef<HTMLInputElement>(null);
  const indice = Math.min(actual, Math.max(0, todas.length - 1));
  const vista = todas[indice];

  const mover = (paso: number) => setActual((indice + paso + todas.length) % todas.length);

  function anadir() {
    const url = nueva.trim();
    if (url === '' || todas.includes(url)) return;
    onCambiarImagenes([...todas, url]);
    if (!principal) onCambiarPrincipal(url);
    setActual(todas.length);
    setNueva('');
  }

  async function alElegirPagina(evento: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    if (archivos.length === 0) return;
    setEstadoTienda('Buscando fotos…');
    try {
      const listas = await Promise.all(archivos.map(extraerImagenes));
      const nuevas = [...new Set(listas.flat())].filter((u) => !todas.includes(u));
      setEncontradas(nuevas);
      setElegidas(new Set(nuevas));
      setEstadoTienda(nuevas.length === 0 ? 'No he encontrado fotos nuevas en esa página.' : null);
    } catch (e) {
      setEstadoTienda((e as Error).message);
    }
  }

  function alternar(url: string) {
    setElegidas((actuales) => {
      const copia = new Set(actuales);
      if (copia.has(url)) copia.delete(url);
      else copia.add(url);
      return copia;
    });
  }

  function anadirElegidas() {
    const nuevas = (encontradas ?? []).filter((u) => elegidas.has(u));
    if (nuevas.length > 0) {
      onCambiarImagenes([...todas, ...nuevas]);
      if (!principal) onCambiarPrincipal(nuevas[0]);
    }
    setEncontradas(null);
  }

  function quitar(url: string) {
    const restantes = todas.filter((u) => u !== url);
    onCambiarImagenes(restantes);
    if (url === principal) onCambiarPrincipal(restantes[0] ?? '');
  }

  return (
    <div className="galeria">
      {todas.length === 0 ? (
        <p className="vacio">
          Sin fotos todavía. Importa la página de la figura de MyFigureCollection o pega aquí el enlace de una imagen.
        </p>
      ) : (
        <>
          <div className="galeria-vista">
            <button type="button" className="secundario flecha" aria-label="Foto anterior" onClick={() => mover(-1)}
              disabled={todas.length < 2}>
              ‹
            </button>
            <img src={vista} referrerPolicy="no-referrer" alt={`${titulo}, foto ${indice + 1} de ${todas.length}`} />
            <button type="button" className="secundario flecha" aria-label="Foto siguiente" onClick={() => mover(1)}
              disabled={todas.length < 2}>
              ›
            </button>
          </div>
          <div className="galeria-acciones">
            <span className="pista">
              {indice + 1} de {todas.length}
              {vista === principal && ' · foto principal'}
            </span>
            <span className="espacio" />
            {vista !== principal && (
              <button type="button" className="secundario" onClick={() => onCambiarPrincipal(vista)}>
                Usar como principal
              </button>
            )}
            <button type="button" className="peligro" onClick={() => quitar(vista)}>
              Quitar foto
            </button>
          </div>
          <div className="galeria-miniaturas">
            {todas.map((url, i) => (
              <button type="button" key={url} className={i === indice ? 'activa' : ''}
                aria-label={`Ver foto ${i + 1}`} onClick={() => setActual(i)}>
                <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </>
      )}
      {encontradas && encontradas.length > 0 && (
        <div className="fotos-tienda">
          <p className="pista">
            Elige las fotos que quieres añadir ({elegidas.size} de {encontradas.length} marcadas):
          </p>
          <div className="fotos-tienda-rejilla">
            {encontradas.map((url) => (
              <label key={url} className={elegidas.has(url) ? 'marcada' : ''}>
                <input type="checkbox" checked={elegidas.has(url)} onChange={() => alternar(url)}
                  aria-label={`Añadir ${url}`} />
                <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </label>
            ))}
          </div>
          <div className="galeria-acciones">
            <span className="espacio" />
            <button type="button" className="secundario" onClick={() => setEncontradas(null)}>
              Cancelar
            </button>
            <button type="button" className="principal" onClick={anadirElegidas}>
              Añadir seleccionadas
            </button>
          </div>
        </div>
      )}
      {estadoTienda && <p className="pista">{estadoTienda}</p>}

      <div className="fila-nueva-tienda">
        <input aria-label="Enlace de una foto nueva" placeholder="Pega el enlace de una imagen (https://...)"
          value={nueva} onChange={(e) => setNueva(e.target.value)} />
        <button type="button" className="secundario" onClick={anadir}>
          Añadir foto
        </button>
      </div>
      <p className="pista">
        ¿Más fotos en una tienda? Guarda la página del producto (Ctrl + S) y{' '}
        <button type="button" className="enlace" onClick={() => selector.current?.click()}>
          sácalas de la página guardada
        </button>
        .
        <input ref={selector} type="file" accept=".html,.htm" multiple hidden onChange={alElegirPagina} />
      </p>
    </div>
  );
}
