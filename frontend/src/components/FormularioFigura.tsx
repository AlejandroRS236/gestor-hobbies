import { useState } from 'react';
import type { FormEvent } from 'react';
import type { EstadoFigura, Figura, FiguraPeticion } from '../tipos';
import { estados, textoEstado } from '../tipos';

interface Props {
  figura?: Figura;
  estadoInicial: EstadoFigura;
  onGuardar: (datos: FiguraPeticion) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCancelar: () => void;
}

interface EnlaceForm {
  tienda: string;
  url: string;
  precio: string;
  envio: string;
}

const enlaceVacio: EnlaceForm = { tienda: '', url: '', precio: '', envio: '' };

const texto = (v: string | null | undefined) => v ?? '';
const numero = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const aTexto = (v: string) => (v.trim() === '' ? null : v.trim());
const aNumero = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

export function FormularioFigura({ figura, estadoInicial, onGuardar, onEliminar, onCancelar }: Props) {
  const [titulo, setTitulo] = useState(texto(figura?.titulo));
  const [estado, setEstado] = useState<EstadoFigura>(figura?.estado ?? estadoInicial);
  const [imagenUrl, setImagenUrl] = useState(texto(figura?.imagenUrl));
  const [fabricante, setFabricante] = useState(texto(figura?.fabricante));
  const [jan, setJan] = useState(texto(figura?.jan));
  const [fechaSalida, setFechaSalida] = useState(texto(figura?.fechaSalida));
  const [pedirAntesDe, setPedirAntesDe] = useState(texto(figura?.pedirAntesDe));
  const [metodoPago, setMetodoPago] = useState(texto(figura?.metodoPago));
  const [riesgo, setRiesgo] = useState(texto(figura?.riesgo));
  const [nota, setNota] = useState(numero(figura?.nota));
  const [notas, setNotas] = useState(texto(figura?.notas));
  const [enlaces, setEnlaces] = useState<EnlaceForm[]>(
    figura?.enlaces.map((e) => ({
      tienda: e.tienda,
      url: e.url,
      precio: numero(e.precio),
      envio: numero(e.envio),
    })) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarEnlace = (indice: number, campo: keyof EnlaceForm, valor: string) =>
    setEnlaces((actuales) => actuales.map((e, i) => (i === indice ? { ...e, [campo]: valor } : e)));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (titulo.trim() === '') {
      setError('Escribe el nombre de la figura.');
      return;
    }
    const enlacesValidos = enlaces.filter((e) => e.tienda.trim() !== '' || e.url.trim() !== '');
    if (enlacesValidos.some((e) => e.tienda.trim() === '' || e.url.trim() === '')) {
      setError('Cada tienda necesita nombre y enlace.');
      return;
    }
    const notaNumero = aNumero(nota);
    if (notaNumero !== null && (Number.isNaN(notaNumero) || notaNumero < 0 || notaNumero > 10)) {
      setError('La nota debe estar entre 0 y 10.');
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
        fechaSalida: aTexto(fechaSalida),
        pedirAntesDe: aTexto(pedirAntesDe),
        metodoPago: aTexto(metodoPago),
        riesgo: aTexto(riesgo),
        enlaces: enlacesValidos.map((e) => ({
          tienda: e.tienda.trim(),
          url: e.url.trim(),
          precio: aNumero(e.precio),
          envio: aNumero(e.envio),
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
          <label className="ancho">
            Imagen (enlace)
            <input value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label>
            Pedir antes de
            <input type="date" value={pedirAntesDe} onChange={(e) => setPedirAntesDe(e.target.value)} />
          </label>
          <label>
            Fecha de salida
            <input type="date" value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} />
          </label>
          <label>
            Código JAN
            <input value={jan} onChange={(e) => setJan(e.target.value)} inputMode="numeric" />
          </label>
          <label>
            Método de pago
            <input value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} />
          </label>
          <label>
            Riesgo
            <input value={riesgo} onChange={(e) => setRiesgo(e.target.value)} />
          </label>
          <label>
            Nota (0-10)
            <input value={nota} onChange={(e) => setNota(e.target.value)} inputMode="decimal" placeholder="8,7" />
          </label>
          <label className="ancho">
            Notas
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </label>
        </div>

        <h3>Tiendas</h3>
        {enlaces.length === 0 && <p className="vacio">Añade dónde comprarla para comparar precios.</p>}
        {enlaces.map((enlace, i) => (
          <div className="fila-enlace" key={i}>
            <input aria-label="Tienda" placeholder="Tienda" value={enlace.tienda}
              onChange={(e) => cambiarEnlace(i, 'tienda', e.target.value)} />
            <input aria-label="Enlace" placeholder="https://..." value={enlace.url}
              onChange={(e) => cambiarEnlace(i, 'url', e.target.value)} />
            <input aria-label="Precio" placeholder="Precio" inputMode="decimal" value={enlace.precio}
              onChange={(e) => cambiarEnlace(i, 'precio', e.target.value)} />
            <input aria-label="Envío" placeholder="Envío" inputMode="decimal" value={enlace.envio}
              onChange={(e) => cambiarEnlace(i, 'envio', e.target.value)} />
            <button type="button" className="secundario" aria-label="Quitar tienda"
              onClick={() => setEnlaces((actuales) => actuales.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
        ))}
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
