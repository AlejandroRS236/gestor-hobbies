import { useState } from 'react';
import type { Actualizacion, EstadoFigura, Figura, Perfil } from '../tipos';
import { colorEstado, estados, textoEstado } from '../tipos';
import { formatearEuros, formatearMomento, formatearNota, textoPlazo } from '../formato';
import { resumir } from '../filtrado';

interface Props {
  figuras: Figura[];
  actualizaciones: Actualizacion[];
  perfil: Perfil;
  onVerLista: (estado: EstadoFigura | 'TODAS') => void;
  onAbrirFigura: (figura: Figura) => void;
  onCambiarFondo: () => void;
}

const MAX_ESCAPARATE = 9;

function Portada({ figura, onAbrir }: { figura: Figura; onAbrir: () => void }) {
  const [rota, setRota] = useState(false);
  return (
    <button type="button" className="portada" onClick={onAbrir} title={figura.titulo} aria-label={figura.titulo}>
      {figura.imagenUrl && !rota ? (
        <img src={figura.imagenUrl} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setRota(true)} />
      ) : (
        <span aria-hidden="true">{figura.titulo.charAt(0)}</span>
      )}
    </button>
  );
}

/** Dos filas de portadas solapadas, como el escaparate de MyAnimeList. */
function Escaparate({ titulo, figuras, pie, onAbrir }: {
  titulo: string; figuras: Figura[]; pie?: string; onAbrir: (f: Figura) => void;
}) {
  const mitad = Math.ceil(figuras.length / 2);
  const filas = figuras.length > 5 ? [figuras.slice(0, mitad), figuras.slice(mitad)] : [figuras];
  return (
    <div className="escaparate">
      <h2>{titulo}</h2>
      {figuras.length === 0 ? (
        <p className="pista">Todavía no hay ninguna.</p>
      ) : (
        <div className="portadas">
          {filas.map((fila, i) => (
            <div key={i} className={i === 1 ? 'fila-portadas desplazada' : 'fila-portadas'}>
              {fila.map((f) => <Portada key={f.id} figura={f} onAbrir={() => onAbrir(f)} />)}
            </div>
          ))}
        </div>
      )}
      {pie && <p className="pie-escaparate">{pie}</p>}
    </div>
  );
}

const masReciente = (a: Figura, b: Figura) => (b.estadoDesde ?? '').localeCompare(a.estadoDesde ?? '');

/** Perfil del hobby Figuras: escaparates, estadísticas, actualizaciones y fechas límite. */
export function PerfilFiguras({ figuras, actualizaciones, perfil, onVerLista, onAbrirFigura, onCambiarFondo }: Props) {
  const conseguidas = figuras.filter((f) => f.estado === 'LA_TENGO').sort(masReciente).slice(0, MAX_ESCAPARATE);
  const reservadas = figuras.filter((f) => f.estado === 'RESERVADA').sort(masReciente).slice(0, MAX_ESCAPARATE);
  const totalReservadas = resumir(figuras.filter((f) => f.estado === 'RESERVADA')).total;
  const estanteria = resumir(figuras.filter((f) => f.estado === 'LA_TENGO'));
  const total = figuras.length;
  const reparto = estados.map((e) => ({ estado: e, n: figuras.filter((f) => f.estado === e).length }));
  const conNota = figuras.filter((f) => f.nota !== null);
  const notaMedia = conNota.length ? conNota.reduce((s, f) => s + (f.nota ?? 0), 0) / conNota.length : null;
  const tiendas = new Set(figuras.flatMap((f) => f.enlaces.map((e) => e.tienda))).size;
  const fabricantes = new Map<string, number>();
  figuras.forEach((f) => f.fabricante && fabricantes.set(f.fabricante, (fabricantes.get(f.fabricante) ?? 0) + 1));
  const favorito = [...fabricantes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const hoy = new Date().toISOString().slice(0, 10);
  const limites = figuras
    .filter((f) => f.pedirAntesDe && f.pedirAntesDe >= hoy && f.estado !== 'LA_TENGO' && f.estado !== 'DESCARTADA')
    .sort((a, b) => (a.pedirAntesDe ?? '').localeCompare(b.pedirAntesDe ?? ''))
    .slice(0, 6);
  const porId = new Map(figuras.map((f) => [f.id, f]));

  return (
    <div className="perfil-hobby">
      <section
        className="banda"
        aria-label="Escaparate"
        style={perfil.fondoUrl ? { backgroundImage: `url("${perfil.fondoUrl}")` } : undefined}
      >
        <div className="banda-contenido">
          <Escaparate titulo="Últimas conseguidas" figuras={conseguidas} onAbrir={onAbrirFigura} />
          <Escaparate
            titulo="Reservadas"
            figuras={reservadas}
            onAbrir={onAbrirFigura}
            pie={totalReservadas > 0 ? `${formatearEuros(totalReservadas)} en reservas` : undefined}
          />
        </div>
        <button type="button" className="cambiar-fondo" onClick={onCambiarFondo}>
          Cambiar fondo
        </button>
      </section>

      <div className="app">
        <div className="cabecera">
          <h2 className="titulo-seccion">Estadísticas</h2>
          <button type="button" className="principal" onClick={() => onVerLista('TODAS')}>
            Ver lista completa
          </button>
        </div>

        <div className="columnas">
          <section aria-label="Figuras por estado">
            <div className="subtitulo">
              <h3>Figuras por estado</h3>
              <button type="button" className="enlace" onClick={() => onVerLista('TODAS')}>Ver todas</button>
            </div>
            <div className="cifras-linea">
              <span>En la estantería: <strong>{reparto.find((r) => r.estado === 'LA_TENGO')?.n ?? 0}</strong></span>
              {notaMedia !== null && <span>Nota media: <strong>{formatearNota(Math.round(notaMedia * 10) / 10)}</strong></span>}
            </div>
            <div className="barra-estados" role="img"
              aria-label={reparto.filter((r) => r.n > 0).map((r) => `${textoEstado[r.estado]}: ${r.n}`).join(', ')}>
              {reparto.filter((r) => r.n > 0).map((r) => (
                <span key={r.estado} style={{ width: `${(r.n / total) * 100}%`, background: colorEstado(r.estado) }} />
              ))}
            </div>
            <div className="estadisticas">
              <ul className="leyenda">
                {reparto.map((r) => (
                  <li key={r.estado}>
                    <span className="punto grande" style={{ background: colorEstado(r.estado) }} />
                    <button type="button" className="enlace-claro" onClick={() => onVerLista(r.estado)}>
                      {textoEstado[r.estado]}
                    </button>
                    <span className="numero">{r.n}</span>
                    <span className="porcentaje">{total ? Math.round((r.n / total) * 100) : 0} %</span>
                  </li>
                ))}
              </ul>
              <dl className="totales">
                <div><dt>Figuras en total</dt><dd>{total}</dd></div>
                <div>
                  <dt>Gastado en las que tengo{estanteria.sinPrecio > 0 ? ` (${estanteria.sinPrecio} sin precio)` : ''}</dt>
                  <dd>{formatearEuros(estanteria.total)}</dd>
                </div>
                <div><dt>Pensando comprar</dt>
                  <dd>{formatearEuros(resumir(figuras.filter((f) => f.estado === 'PENSANDO_COMPRAR')).total)}</dd></div>
                <div><dt>Reservadas</dt><dd>{formatearEuros(totalReservadas)}</dd></div>
                <div><dt>Tiendas usadas</dt><dd>{tiendas}</dd></div>
                {favorito && <div><dt>Fabricante favorito</dt><dd>{favorito}</dd></div>}
              </dl>
            </div>
          </section>

          <section aria-label="Últimas actualizaciones">
            <div className="subtitulo">
              <h3>Últimas actualizaciones</h3>
            </div>
            {actualizaciones.length === 0 && <p className="vacio">Aún no hay cambios registrados.</p>}
            <ul className="actualizaciones">
              {actualizaciones.map((a, i) => {
                const figura = porId.get(a.figuraId);
                return (
                  <li key={`${a.figuraId}-${a.fecha}-${i}`}>
                    <div className="mini">
                      {a.imagenUrl ? <img src={a.imagenUrl} alt="" referrerPolicy="no-referrer" loading="lazy" /> : null}
                    </div>
                    <div className="act-datos">
                      <button type="button" className="enlace-claro" onClick={() => figura && onAbrirFigura(figura)}>
                        {a.titulo}
                      </button>
                      <span className="act-detalle">
                        <span className="chip" style={{ background: colorEstado(a.nuevo) }}>{textoEstado[a.nuevo]}</span>
                        {a.anterior ? ` antes ${textoEstado[a.anterior]}` : ' añadida'}
                      </span>
                    </div>
                    <span className="act-fecha">{formatearMomento(a.fecha)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section aria-label="Fechas límite próximas">
          <div className="subtitulo">
            <h3>Fechas límite próximas</h3>
          </div>
          {limites.length === 0 && <p className="vacio">Ninguna figura tiene fecha límite pendiente.</p>}
          <div className="limites">
            {limites.map((f) => {
              const mejor = f.enlaces.find((e) => e.id === f.mejorEnlaceId);
              const cuando = textoPlazo(f.pedirAntesDe!);
              return (
                <button key={f.id} type="button" className="limite" onClick={() => onAbrirFigura(f)}>
                  <span className="limite-datos">
                    <span>{f.titulo}</span>
                    <span className="pista">
                      {mejor?.tienda}{f.mejorTotal !== null ? ` · ${formatearEuros(f.mejorTotal)}` : ''}
                    </span>
                  </span>
                  <span className={cuando.startsWith('en ') || cuando === 'hoy' || cuando === 'mañana' ? 'limite-cuando urgente' : 'limite-cuando'}>
                    {cuando}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
