import { useEffect, useState } from 'react';
import { listarFiguras } from './api';
import { TarjetaFigura } from './components/TarjetaFigura';
import type { EstadoFigura, Figura } from './tipos';
import { estados, textoEstado } from './tipos';

export default function App() {
  const [estado, setEstado] = useState<EstadoFigura>('PENSANDO_COMPRAR');
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarFiguras(estado)
      .then((datos) => {
        if (!cancelado) {
          setFiguras(datos);
          setError(null);
        }
      })
      .catch((e: Error) => !cancelado && setError(e.message));
    return () => {
      cancelado = true;
    };
  }, [estado]);

  return (
    <main className="app">
      <header>
        <h1>Figuras</h1>
        <nav className="pestanas">
          {estados.map((e) => (
            <button key={e} className={e === estado ? 'activa' : ''} onClick={() => setEstado(e)}>
              {textoEstado[e]}
            </button>
          ))}
        </nav>
      </header>

      {error && <p className="error">{error}</p>}
      {!error && figuras.length === 0 && <p className="vacio">No hay figuras en esta lista todavía.</p>}

      <section className="rejilla">
        {figuras.map((f) => (
          <TarjetaFigura key={f.id} figura={f} />
        ))}
      </section>
    </main>
  );
}
