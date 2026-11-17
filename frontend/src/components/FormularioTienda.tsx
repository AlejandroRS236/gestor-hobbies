import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Confianza, Tienda } from '../tipos';
import { textoConfianza } from '../tipos';
import { aNumero, aTexto, numeroATexto, texto } from '../formato';

interface Props {
  tienda: Tienda | null;
  onGuardar: (tienda: Tienda) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCancelar: () => void;
}

export function FormularioTienda({ tienda, onGuardar, onEliminar, onCancelar }: Props) {
  const [nombre, setNombre] = useState(texto(tienda?.nombre));
  const [web, setWeb] = useState(texto(tienda?.web));
  const [pais, setPais] = useState(texto(tienda?.pais));
  const [envio, setEnvio] = useState(numeroATexto(tienda?.envioPorDefecto));
  const [confianza, setConfianza] = useState<Confianza>(tienda?.confianza ?? 'FIABLE');
  const [metodosPago, setMetodosPago] = useState(texto(tienda?.metodosPago));
  const [condiciones, setCondiciones] = useState(texto(tienda?.condiciones));
  const [notas, setNotas] = useState(texto(tienda?.notas));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (nombre.trim() === '') {
      setError('Escribe el nombre de la tienda.');
      return;
    }
    const envioNumero = aNumero(envio);
    if (envioNumero !== null && (Number.isNaN(envioNumero) || envioNumero < 0)) {
      setError('El envío debe ser un número positivo.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        id: tienda?.id ?? null,
        nombre: nombre.trim(),
        web: aTexto(web),
        pais: aTexto(pais),
        envioPorDefecto: envioNumero,
        confianza,
        metodosPago: aTexto(metodosPago),
        condiciones: aTexto(condiciones),
        notas: aTexto(notas),
      });
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!onEliminar || !window.confirm(`¿Eliminar la tienda "${tienda?.nombre}"?`)) return;
    try {
      await onEliminar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="fondo-modal" onClick={onCancelar}>
      <form className="modal" onSubmit={enviar} onClick={(e) => e.stopPropagation()} aria-label="Formulario de tienda">
        <h2>{tienda ? 'Editar tienda' : 'Nueva tienda'}</h2>
        <div className="campos">
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </label>
          <label>
            País
            <input value={pais} onChange={(e) => setPais(e.target.value)} />
          </label>
          <label>
            Confianza
            <select value={confianza} onChange={(e) => setConfianza(e.target.value as Confianza)}>
              {(Object.keys(textoConfianza) as Confianza[]).map((c) => (
                <option key={c} value={c}>
                  {textoConfianza[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="doble">
            Web
            <input value={web} onChange={(e) => setWeb(e.target.value)} placeholder="https://..." />
          </label>
          <label>
            Envío habitual (€)
            <input value={envio} onChange={(e) => setEnvio(e.target.value)} inputMode="decimal" />
          </label>
          <label className="ancho">
            Métodos de pago
            <input value={metodosPago} onChange={(e) => setMetodosPago(e.target.value)}
              placeholder="PayPal, tarjeta, Bizum..." />
          </label>
          <label className="ancho">
            Condiciones (reservas, señal, cancelaciones, envíos...)
            <textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} rows={5} />
          </label>
          <label className="ancho">
            Notas
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </label>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="acciones">
          {tienda && onEliminar && (
            <button type="button" className="peligro" onClick={eliminar}>
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
