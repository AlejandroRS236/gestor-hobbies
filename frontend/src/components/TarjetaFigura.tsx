import { useState } from 'react';
import type { Figura } from '../tipos';
import { textoEstado } from '../tipos';
import { formatearEuros, formatearFecha, formatearNota } from '../formato';

interface Props {
  figura: Figura;
  onAbrir?: () => void;
}

export function TarjetaFigura({ figura, onAbrir }: Props) {
  const mejorEnlace = figura.enlaces.find((e) => e.id === figura.mejorEnlaceId);
  const reservada = figura.enlaces.find((e) => e.estado === 'RESERVADA');
  const [imagenRota, setImagenRota] = useState(false);

  return (
    <article
      className="tarjeta"
      role={onAbrir ? 'button' : undefined}
      tabIndex={onAbrir ? 0 : undefined}
      aria-label={onAbrir ? `Editar ${figura.titulo}` : undefined}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (onAbrir && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAbrir();
        }
      }}
    >
      <div className="tarjeta-imagen">
        {figura.imagenUrl && !imagenRota ? (
          <img src={figura.imagenUrl} alt={figura.titulo} referrerPolicy="no-referrer" loading="lazy"
            onError={() => setImagenRota(true)} />
        ) : (
          <span aria-hidden="true">?</span>
        )}
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
        {reservada && <p className="etiqueta-reserva">Reservada en {reservada.tienda}</p>}
        {figura.avisoNoComprar && <p className="aviso">Tiene una tienda marcada como "no comprar"</p>}
        {figura.ficha?.avisos?.toLowerCase().includes('counterfeit') && (
          <p className="aviso">Existen falsificaciones de esta figura</p>
        )}
        {figura.enlaces.length > 1 && <p className="alternativas">{figura.enlaces.length} tiendas</p>}
      </div>
    </article>
  );
}
