import { useCallback, useEffect, useState } from 'react';
import { actualizarFigura, crearFigura, eliminarFigura, listarFiguras } from './api';
import { FormularioFigura } from './components/FormularioFigura';
import { TarjetaFigura } from './components/TarjetaFigura';
import type { EstadoFigura, Figura, FiguraPeticion } from './tipos';
import { estados, textoEstado } from './tipos';

type Edicion = { modo: 'nueva' } | { modo: 'editar'; figura: Figura } | null;

export default function App() {
  const [estado, setEstado] = useState<EstadoFigura>('PENSANDO_COMPRAR');
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Edicion>(null);

  const cargar = useCallback(async () => {
    try {
      setFiguras(await listarFiguras(estado));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [estado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function guardar(datos: FiguraPeticion) {
    if (edicion?.modo === 'editar') {
      await actualizarFigura(edicion.figura.id, datos);
    } else {
      await crearFigura(datos);
    }
    setEdicion(null);
    if (datos.estado !== estado) {
      setEstado(datos.estado);
    } else {
      await cargar();
    }
  }

  async function eliminar(figura: Figura) {
    await eliminarFigura(figura.id);
    setEdicion(null);
    await cargar();
  }

  return (
    <main className="app">
      <header className="cabecera">
        <h1>Figuras</h1>
        <button className="principal" onClick={() => setEdicion({ modo: 'nueva' })}>
          + Añadir figura
        </button>
      </header>

      <nav className="pestanas">
        {estados.map((e) => (
          <button key={e} className={e === estado ? 'activa' : ''} onClick={() => setEstado(e)}>
            {textoEstado[e]}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}
      {!error && figuras.length === 0 && <p className="vacio">No hay figuras en esta lista todavía.</p>}

      <section className="rejilla">
        {figuras.map((f) => (
          <TarjetaFigura key={f.id} figura={f} onAbrir={() => setEdicion({ modo: 'editar', figura: f })} />
        ))}
      </section>

      {edicion && (
        <FormularioFigura
          key={edicion.modo === 'editar' ? edicion.figura.id : 'nueva'}
          figura={edicion.modo === 'editar' ? edicion.figura : undefined}
          estadoInicial={estado}
          onGuardar={guardar}
          onEliminar={edicion.modo === 'editar' ? () => eliminar(edicion.figura) : undefined}
          onCancelar={() => setEdicion(null)}
        />
      )}
    </main>
  );
}
