import type { Figura } from '../tipos';
import { textoEstado } from '../tipos';
import { formatearEuros, formatearFecha, formatearNota } from '../formato';

interface Props {
  figura: Figura;
}

export function TarjetaFigura({ figura }: Props) {
  const mejorEnlace = figura.enlaces.find((e) => e.total !== null && e.total === figura.mejorTotal);

  return (
    <article className="tarjeta">
      <div className="tarjeta-imagen">
        {figura.imagenUrl ? <img src={figura.imagenUrl} alt={figura.titulo} /> : <span aria-hidden="true">?</span>}
      </div>
      <div className="tarjeta-cuerpo">
        <span className={`chip chip-${figura.estado.toLowerCase()}`}>{textoEstado[figura.estado]}</span>
        <h3>{figura.titulo}</h3>
        {mejorEnlace && figura.mejorTotal !== null && (
          <p className="fila">
            <span>{mejorEnlace.tienda}</span>
            <span>{formatearEuros(figura.mejorTotal)}</span>
          </p>
        )}
        {figura.pedirAntesDe && (
          <p className="fila">
            <span>Pedir antes de</span>
            <span>{formatearFecha(figura.pedirAntesDe)}</span>
          </p>
        )}
        {figura.nota !== null && (
          <p className="fila">
            <span>Nota</span>
            <span>{formatearNota(figura.nota)}</span>
          </p>
        )}
        {figura.enlaces.length > 1 && <p className="alternativas">{figura.enlaces.length} tiendas</p>}
      </div>
    </article>
  );
}
