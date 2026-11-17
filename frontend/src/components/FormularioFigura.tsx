import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Enlace, EstadoEnlace, EstadoFigura, Figura, FiguraPeticion, Tienda } from '../tipos';
import { estados, textoEstado, textoEstadoEnlace } from '../tipos';
import { aNumero, aTexto, formatearEuros, formatearFecha, numeroATexto, texto } from '../formato';

interface Props {
  figura?: Figura;
  tiendas: Tienda[];
  estadoInicial: EstadoFigura;
  onGuardar: (datos: FiguraPeticion) => Promise<void>;
  onCrearTienda: (nombre: string) => Promise<Tienda>;
  onEliminar?: () => Promise<void>;
  onCancelar: () => void;
}

const NUEVA = '__nueva__';

interface EnlaceForm {
  tiendaId: string;
  nuevaTienda: string;
  url: string;
  precio: string;
  envio: string;
  salida: string;
  pedirAntesDe: string;
  estado: EstadoEnlace;
  notas: string;
  precioVisto: number | null;
  comprobadoEl: string | null;
}

const enlaceVacio: EnlaceForm = {
  tiendaId: '', nuevaTienda: '', url: '', precio: '', envio: '', salida: '', pedirAntesDe: '',
  estado: 'NORMAL', notas: '', precioVisto: null, comprobadoEl: null,
};

const desdeEnlace = (e: Enlace): EnlaceForm => ({
  tiendaId: String(e.tiendaId),
  nuevaTienda: '',
  url: texto(e.url),
  precio: numeroATexto(e.precio),
  envio: numeroATexto(e.envio),
  salida: texto(e.salida),
  pedirAntesDe: texto(e.pedirAntesDe),
  estado: e.estado,
  notas: texto(e.notas),
  precioVisto: e.precioVisto,
  comprobadoEl: e.comprobadoEl,
});

export function FormularioFigura(props: Props) {
  const { figura, tiendas, estadoInicial, onGuardar, onCrearTienda, onEliminar, onCancelar } = props;
  const [titulo, setTitulo] = useState(texto(figura?.titulo));
  const [estado, setEstado] = useState<EstadoFigura>(figura?.estado ?? estadoInicial);
  const [imagenUrl, setImagenUrl] = useState(texto(figura?.imagenUrl));
  const [fabricante, setFabricante] = useState(texto(figura?.fabricante));
  const [jan, setJan] = useState(texto(figura?.jan));
  const [riesgo, setRiesgo] = useState(texto(figura?.riesgo));
  const [nota, setNota] = useState(numeroATexto(figura?.nota));
  const [notas, setNotas] = useState(texto(figura?.notas));
  const [enlaces, setEnlaces] = useState<EnlaceForm[]>(figura?.enlaces.map(desdeEnlace) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarEnlace = (indice: number, cambios: Partial<EnlaceForm>) =>
    setEnlaces((actuales) => actuales.map((e, i) => (i === indice ? { ...e, ...cambios } : e)));

  function elegirTienda(indice: number, valor: string) {
    const tienda = tiendas.find((t) => String(t.id) === valor);
    const actual = enlaces[indice];
    cambiarEnlace(indice, {
      tiendaId: valor,
      envio: actual.envio === '' && tienda ? numeroATexto(tienda.envioPorDefecto) : actual.envio,
    });
  }

  async function crearTienda(indice: number) {
    const nombre = enlaces[indice].nuevaTienda.trim();
    if (nombre === '') {
      setError('Escribe el nombre de la tienda nueva.');
      return;
    }
    try {
      const tienda = await onCrearTienda(nombre);
      cambiarEnlace(indice, { tiendaId: String(tienda.id), nuevaTienda: '' });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (titulo.trim() === '') {
      setError('Escribe el nombre de la figura.');
      return;
    }
    if (enlaces.some((e) => e.tiendaId === '' || e.tiendaId === NUEVA)) {
      setError('Elige la tienda de cada fila (o crea la nueva antes de guardar).');
      return;
    }
    const notaNumero = aNumero(nota);
    if (notaNumero !== null && (Number.isNaN(notaNumero) || notaNumero < 0 || notaNumero > 10)) {
      setError('La nota debe estar entre 0 y 10.');
      return;
    }
    const conNumeroMalo = enlaces.some(
      (e) => [aNumero(e.precio), aNumero(e.envio)].some((n) => n !== null && (Number.isNaN(n) || n < 0)),
    );
    if (conNumeroMalo) {
      setError('Revisa los precios: deben ser números positivos.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        titulo: titulo.trim(),
        estado,
        imagenUrl: aTexto(imagenUrl),
        nota: notaNumero,
        notas: aTexto(notas),
        fabricante: aTexto(fabricante),
        jan: aTexto(jan),
        riesgo: aTexto(riesgo),
        enlaces: enlaces.map((e) => ({
          tiendaId: Number(e.tiendaId),
          url: aTexto(e.url),
          precio: aNumero(e.precio),
          envio: aNumero(e.envio),
          salida: aTexto(e.salida),
          pedirAntesDe: aTexto(e.pedirAntesDe),
          estado: e.estado,
          notas: aTexto(e.notas),
          precioVisto: e.precioVisto,
          comprobadoEl: e.comprobadoEl,
        })),
      });
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!onEliminar || !window.confirm(`¿Eliminar "${figura?.titulo}"?`)) return;
    setGuardando(true);
    try {
      await onEliminar();
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  return (
    <div className="fondo-modal" onClick={onCancelar}>
      <form className="modal" onSubmit={enviar} onClick={(e) => e.stopPropagation()} aria-label="Formulario de figura">
        <h2>{figura ? 'Editar figura' : 'Nueva figura'}</h2>

        <div className="campos">
          <label className="ancho">
            Nombre
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
          </label>
          <label>
            Estado
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoFigura)}>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {textoEstado[e]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fabricante
            <input value={fabricante} onChange={(e) => setFabricante(e.target.value)} />
          </label>
          <label>
            Riesgo
            <input value={riesgo} onChange={(e) => setRiesgo(e.target.value)} placeholder="Alto, medio, bajo..." />
          </label>
          <label className="ancho">
            Imagen (enlace)
            <input value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label>
            Código JAN
            <input value={jan} onChange={(e) => setJan(e.target.value)} inputMode="numeric" />
          </label>
          <label>
            Nota (0-10)
            <input value={nota} onChange={(e) => setNota(e.target.value)} inputMode="decimal" placeholder="8,7" />
          </label>
          <span />
          <label className="ancho">
            Notas
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </label>
        </div>

        <h3>Tiendas</h3>
        {enlaces.length === 0 && <p className="vacio">Añade dónde comprarla para comparar precios.</p>}
        {enlaces.map((enlace, i) => {
          const tienda = tiendas.find((t) => String(t.id) === enlace.tiendaId);
          return (
            <fieldset className="bloque-enlace" key={i}>
              <div className="fila-enlace">
                <select aria-label="Tienda" value={enlace.tiendaId} onChange={(e) => elegirTienda(i, e.target.value)}>
                  <option value="">Elige tienda…</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.nombre}
                      {t.confianza === 'NO_COMPRAR' ? ' (no comprar)' : ''}
                    </option>
                  ))}
                  <option value={NUEVA}>+ Nueva tienda…</option>
                </select>
                <input aria-label="Enlace" placeholder="https://..." value={enlace.url}
                  onChange={(e) => cambiarEnlace(i, { url: e.target.value })} />
                <input aria-label="Precio" placeholder="Precio" inputMode="decimal" value={enlace.precio}
                  onChange={(e) => cambiarEnlace(i, { precio: e.target.value })} />
                <input aria-label="Envío" placeholder="Envío" inputMode="decimal" value={enlace.envio}
                  onChange={(e) => cambiarEnlace(i, { envio: e.target.value })} />
                <button type="button" className="secundario" aria-label="Quitar tienda"
                  onClick={() => setEnlaces((actuales) => actuales.filter((_, j) => j !== i))}>
                  ×
                </button>
              </div>

              {enlace.tiendaId === NUEVA && (
                <div className="fila-nueva-tienda">
                  <input aria-label="Nombre de la tienda nueva" placeholder="Nombre de la tienda"
                    value={enlace.nuevaTienda} onChange={(e) => cambiarEnlace(i, { nuevaTienda: e.target.value })} />
                  <button type="button" className="secundario" onClick={() => crearTienda(i)}>
                    Crear tienda
                  </button>
                </div>
              )}

              {tienda?.confianza === 'NO_COMPRAR' && (
                <p className="aviso">Esta tienda está marcada como "no comprar".</p>
              )}

              <div className="fila-enlace-extra">
                <select aria-label="Estado en la tienda" value={enlace.estado}
                  onChange={(e) => cambiarEnlace(i, { estado: e.target.value as EstadoEnlace })}>
                  {(Object.keys(textoEstadoEnlace) as EstadoEnlace[]).map((e) => (
                    <option key={e} value={e}>
                      {textoEstadoEnlace[e]}
                    </option>
                  ))}
                </select>
                <input aria-label="Salida" placeholder="Salida (Ene 2028, En stock...)" value={enlace.salida}
                  onChange={(e) => cambiarEnlace(i, { salida: e.target.value })} />
                <label className="fecha-en-linea">
                  Pedir antes de
                  <input type="date" value={enlace.pedirAntesDe}
                    onChange={(e) => cambiarEnlace(i, { pedirAntesDe: e.target.value })} />
                </label>
              </div>
              <textarea aria-label="Notas de esta tienda" placeholder="Notas de esta figura en esta tienda"
                rows={2} value={enlace.notas} onChange={(e) => cambiarEnlace(i, { notas: e.target.value })} />
              {enlace.precioVisto !== null && enlace.comprobadoEl && (
                <p className="pista">
                  Último precio visto: {formatearEuros(enlace.precioVisto)} el {formatearFecha(enlace.comprobadoEl)}
                </p>
              )}
            </fieldset>
          );
        })}
        <button type="button" className="secundario" onClick={() => setEnlaces((a) => [...a, { ...enlaceVacio }])}>
          + Añadir tienda
        </button>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="acciones">
          {figura && onEliminar && (
            <button type="button" className="peligro" onClick={eliminar} disabled={guardando}>
              Eliminar
            </button>
          )}
          <span className="espacio" />
          <button type="button" className="secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="principal" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
