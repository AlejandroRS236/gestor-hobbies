import type { EstadoFigura, Figura, Perfil } from '../tipos';
import { colorEstado, estados } from '../tipos';
import { formatearFecha } from '../formato';

interface Props {
  perfil: Perfil;
  figuras: Figura[];
  onAbrirFiguras: () => void;
  onEditarPerfil: () => void;
}

const HOBBIES_FUTUROS = [
  { nombre: 'Anime', resumen: 'Importar desde MyAnimeList', fase: 'Fase 2' },
  { nombre: 'Lectura', resumen: 'Novelas, manga, manhwa y manhua', fase: 'Fase 2' },
  { nombre: 'Videojuegos', resumen: 'Plataformas y horas jugadas', fase: 'Fase 4' },
];

/** Pantalla inicial: el perfil y la elección de hobby. */
export function Inicio({ perfil, figuras, onAbrirFiguras, onEditarPerfil }: Props) {
  const nombre = perfil.nombre ?? 'Tu perfil';
  const tengo = figuras.filter((f) => f.estado === 'LA_TENGO').length;
  const reservas = figuras.filter((f) => f.estado === 'RESERVADA').length;
  const hoy = new Date().toISOString().slice(0, 10);
  const proxima = figuras
    .filter((f) => f.estado !== 'DESCARTADA' && f.estado !== 'LA_TENGO')
    .map((f) => f.pedirAntesDe)
    .filter((d): d is string => d !== null && d >= hoy)
    .sort()[0];
  const reparto = estados
    .map((e: EstadoFigura) => ({ estado: e, n: figuras.filter((f) => f.estado === e).length }))
    .filter((r) => r.n > 0);

  return (
    <div className="inicio">
      <section className="perfil" aria-label="Perfil">
        <div className="avatar">
          {perfil.avatarUrl ? (
            <img src={perfil.avatarUrl} alt={`Foto de ${nombre}`} referrerPolicy="no-referrer" />
          ) : (
            <span aria-hidden="true">{nombre.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="perfil-datos">
          <h1>{nombre}</h1>
          <p className="pista">Figuras, anime, lectura y videojuegos en un solo sitio.</p>
          <p className="perfil-cifras">
            <span><strong>{figuras.length}</strong> figuras</span>
            <span><strong>{tengo}</strong> en la estantería</span>
            <span><strong>{reservas}</strong> reservadas</span>
            {proxima && <span>Próxima fecha límite: <strong className="aviso-texto">{formatearFecha(proxima)}</strong></span>}
          </p>
        </div>
        <button type="button" className="secundario" onClick={onEditarPerfil}>
          Editar perfil
        </button>
      </section>

      <section aria-label="Hobbies">
        <h2 className="titulo-seccion">Elige un hobby</h2>
        <div className="hobbies">
          <button type="button" className="hobby disponible" onClick={onAbrirFiguras}>
            <span className="hobby-nombre">Figuras</span>
            <span className="pista">{figuras.length} figuras · {tengo} en la estantería</span>
            <span className="barra-mini" aria-hidden="true">
              {reparto.map((r) => (
                <span key={r.estado} style={{ width: `${(r.n / figuras.length) * 100}%`, background: colorEstado(r.estado) }} />
              ))}
            </span>
          </button>
          {HOBBIES_FUTUROS.map((h) => (
            <div key={h.nombre} className="hobby">
              <span className="hobby-nombre">{h.nombre}</span>
              <span className="pista">{h.resumen}</span>
              <span className="pista">Llegará en la {h.fase}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
