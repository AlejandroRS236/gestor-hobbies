import type { Figura } from '../tipos';
import type { Filtros, Orden, Plazo } from '../filtrado';
import { filtrosVacios, hayFiltros, opciones, salidaDe } from '../filtrado';

interface Props {
  figuras: Figura[];
  filtros: Filtros;
  onCambiar: (filtros: Filtros) => void;
}

export function BarraFiltros({ figuras, filtros, onCambiar }: Props) {
  const cambiar = <K extends keyof Filtros>(clave: K, valor: Filtros[K]) => onCambiar({ ...filtros, [clave]: valor });

  const tiendas = opciones(figuras, (f) => f.enlaces.map((e) => e.tienda));
  const fabricantes = opciones(figuras, (f) => [f.fabricante]);
  const series = opciones(figuras, (f) => [f.ficha.serie]);
  const riesgos = opciones(figuras, (f) => [f.riesgo]);
  const anios = opciones(figuras, (f) => {
    const s = salidaDe(f);
    return [s === null ? null : String(Math.floor(s / 100))];
  });

  const desplegable = (clave: 'tienda' | 'fabricante' | 'serie' | 'riesgo' | 'anioSalida', etiqueta: string,
    valores: string[]) => (
    <label>
      {etiqueta}
      <select value={filtros[clave]} onChange={(e) => cambiar(clave, e.target.value)}>
        <option value="">Todos</option>
        {valores.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="filtros" aria-label="Filtros">
      <label className="buscar">
        Buscar
        <input type="search" placeholder="Nombre, serie, personaje, fabricante…" value={filtros.texto}
          onChange={(e) => cambiar('texto', e.target.value)} />
      </label>
      {desplegable('tienda', 'Tienda', tiendas)}
      {desplegable('fabricante', 'Fabricante', fabricantes)}
      {desplegable('serie', 'Serie', series)}
      {desplegable('anioSalida', 'Año de salida', anios)}
      {desplegable('riesgo', 'Riesgo', riesgos)}
      <label>
        Precio (€)
        <span className="rango">
          <input aria-label="Precio mínimo" placeholder="mín" inputMode="decimal" value={filtros.precioMin}
            onChange={(e) => cambiar('precioMin', e.target.value)} />
          <input aria-label="Precio máximo" placeholder="máx" inputMode="decimal" value={filtros.precioMax}
            onChange={(e) => cambiar('precioMax', e.target.value)} />
        </span>
      </label>
      <label>
        Pedir antes de
        <select value={filtros.plazo} onChange={(e) => cambiar('plazo', e.target.value as Plazo)}>
          <option value="todos">Sin filtrar</option>
          <option value="7">Próximos 7 días</option>
          <option value="30">Próximos 30 días</option>
          <option value="con-fecha">Con fecha límite</option>
        </select>
      </label>
      <label>
        Ordenar por
        <select value={filtros.orden} onChange={(e) => cambiar('orden', e.target.value as Orden)}>
          <option value="nombre">Nombre</option>
          <option value="precio-asc">Precio: menor primero</option>
          <option value="precio-desc">Precio: mayor primero</option>
          <option value="limite">Fecha límite más cercana</option>
          <option value="salida">Salida más próxima</option>
        </select>
      </label>
      <label className="casilla">
        <input type="checkbox" checked={filtros.soloReservadas}
          onChange={(e) => cambiar('soloReservadas', e.target.checked)} />
        Solo con reserva hecha
      </label>
      {hayFiltros(filtros) && (
        <button type="button" className="enlace" onClick={() => onCambiar({ ...filtrosVacios, orden: filtros.orden })}>
          Quitar filtros
        </button>
      )}
    </section>
  );
}
