import { useState } from 'react';

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
            <img src={vista} alt={`${titulo}, foto ${indice + 1} de ${todas.length}`} />
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
                <img src={url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
      <div className="fila-nueva-tienda">
        <input aria-label="Enlace de una foto nueva" placeholder="Pega el enlace de una imagen (https://...)"
          value={nueva} onChange={(e) => setNueva(e.target.value)} />
        <button type="button" className="secundario" onClick={anadir}>
          Añadir foto
        </button>
      </div>
    </div>
  );
}
