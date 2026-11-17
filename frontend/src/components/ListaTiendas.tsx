import type { Tienda } from '../tipos';
import { textoConfianza } from '../tipos';
import { formatearEuros } from '../formato';

interface Props {
  tiendas: Tienda[];
  onAbrir: (tienda: Tienda) => void;
}

export function ListaTiendas({ tiendas, onAbrir }: Props) {
  if (tiendas.length === 0) {
    return <p className="vacio">Todavía no hay tiendas. Crea una o importa tu Excel.</p>;
  }
  return (
    <ul className="lista-tiendas">
      {tiendas.map((t) => (
        <li key={t.id}>
          <button className="fila-tienda" onClick={() => onAbrir(t)}>
            <span className="nombre-tienda">{t.nombre}</span>
            <span className="dato">{t.pais ?? ''}</span>
            <span className="dato">
              {t.envioPorDefecto !== null ? `Envío ${formatearEuros(t.envioPorDefecto)}` : ''}
            </span>
            <span className={`chip chip-confianza-${t.confianza.toLowerCase()}`}>{textoConfianza[t.confianza]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
