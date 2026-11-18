import { useState } from 'react';
import type { Figura } from '../tipos';
import { colorEstado, textoEstado } from '../tipos';
import { diasHasta, formatearEuros, formatearNota } from '../formato';

interface Props {
  figura: Figura;
  onAbrir?: () => void;
  hoy?: Date;
}

/** Tarjeta de la lista: foto grande con el estado, el precio y el aviso de plazo encima. */
export function TarjetaFigura({ figura, onAbrir, hoy = new Date() }: Props) {
  const mejorEnlace = figura.enlaces.find((e) => e.id === figura.mejorEnlaceId);
  const reservada = figura.enlaces.find((e) => e.estado === 'RESERVADA');
  const [imagenRota, setImagenRota] = useState(false);
  const dias = figura.pedirAntesDe ? diasHasta(figura.pedirAntesDe, hoy) : null;
  const plazo = dias === null || dias < 0 || dias > 30 ? null
    : dias === 0 ? 'Último día' : dias === 1 ? 'Pedir mañana' : `Pedir en ${dias} días`;
  const falsificaciones = figura.ficha?.avisos?.toLowerCase().includes('counterfeit');

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
        <span className="sobre-imagen estado">
          <span className="punto" style={{ background: colorEstado(figura.estado) }} />
          {textoEstado[figura.estado]}
        </span>
        {plazo && <span className="sobre-imagen plazo">{plazo}</span>}
        {figura.mejorTotal !== null && (
          <span className="sobre-imagen precio">{formatearEuros(figura.mejorTotal)}</span>
        )}
      </div>
      <div className="tarjeta-cuerpo">
        <h3>{figura.titulo}</h3>
        {mejorEnlace && <span className="sub">{mejorEnlace.tienda}</span>}
        {figura.nota !== null && (
          <p className="fila">
            <span>Nota</span>
            <span>{formatearNota(figura.nota)}</span>
          </p>
        )}
        {reservada && <p className="etiqueta-reserva">Reservada en {reservada.tienda}</p>}
        {figura.avisoNoComprar && <p className="aviso">Tiene una tienda marcada como "no comprar"</p>}
        {falsificaciones && <p className="aviso">Existen falsificaciones de esta figura</p>}
        {figura.enlaces.length > 1 && <p className="alternativas">{figura.enlaces.length} tiendas</p>}
      </div>
    </article>
  );
}
