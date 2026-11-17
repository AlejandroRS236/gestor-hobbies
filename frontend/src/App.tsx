import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  actualizarFigura, crearFigura, eliminarFigura, eliminarTienda, guardarTienda, importarArchivo,
  listarFiguras, listarTiendas,
} from './api';
import { FormularioFigura } from './components/FormularioFigura';
import { FormularioTienda } from './components/FormularioTienda';
import { ListaTiendas } from './components/ListaTiendas';
import { TarjetaFigura } from './components/TarjetaFigura';
import type { EstadoFigura, Figura, FiguraPeticion, Tienda } from './tipos';
import { estados, textoEstado } from './tipos';

type Vista = 'figuras' | 'tiendas';
type EdicionFigura = { modo: 'nueva' } | { modo: 'editar'; figura: Figura } | null;
type EdicionTienda = { tienda: Tienda | null } | null;

export default function App() {
  const [vista, setVista] = useState<Vista>('figuras');
  const [estado, setEstado] = useState<EstadoFigura>('PENSANDO_COMPRAR');
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [edicionFigura, setEdicionFigura] = useState<EdicionFigura>(null);
  const [edicionTienda, setEdicionTienda] = useState<EdicionTienda>(null);
  const selectorExcel = useRef<HTMLInputElement>(null);

  const cargarFiguras = useCallback(async () => {
    try {
      setFiguras(await listarFiguras(estado));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [estado]);

  const cargarTiendas = useCallback(async () => {
    try {
      setTiendas(await listarTiendas());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void cargarFiguras();
  }, [cargarFiguras]);

  useEffect(() => {
    void cargarTiendas();
  }, [cargarTiendas]);

  async function guardarFigura(datos: FiguraPeticion) {
    if (edicionFigura?.modo === 'editar') {
      await actualizarFigura(edicionFigura.figura.id, datos);
    } else {
      await crearFigura(datos);
    }
    setEdicionFigura(null);
    if (datos.estado !== estado) {
      setEstado(datos.estado);
    } else {
      await cargarFiguras();
    }
  }

  async function borrarFigura(figura: Figura) {
    await eliminarFigura(figura.id);
    setEdicionFigura(null);
    await cargarFiguras();
  }

  async function crearTiendaRapida(nombre: string) {
    const tienda = await guardarTienda({
      id: null, nombre, web: null, pais: null, metodosPago: null, condiciones: null,
      envioPorDefecto: null, confianza: 'FIABLE', notas: null,
    });
    await cargarTiendas();
    return tienda;
  }

  async function guardarFichaTienda(tienda: Tienda) {
    await guardarTienda(tienda);
    setEdicionTienda(null);
    await Promise.all([cargarTiendas(), cargarFiguras()]);
  }

  async function borrarTienda(tienda: Tienda) {
    await eliminarTienda(tienda.id!);
    setEdicionTienda(null);
    await cargarTiendas();
  }

  async function alElegirExcel(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setMensaje('Importando…');
    try {
      const r = await importarArchivo(archivo);
      const partes = [`${r.figurasCreadas} figuras importadas`];
      if (r.tiendasCreadas > 0) partes.push(`${r.tiendasCreadas} tiendas nuevas`);
      if (r.figurasOmitidas > 0) partes.push(`${r.figurasOmitidas} ya existían y no se han tocado`);
      setMensaje(partes.join(', ') + '.' + (r.avisos.length ? ` Avisos: ${r.avisos.join(' · ')}` : ''));
      await Promise.all([cargarFiguras(), cargarTiendas()]);
    } catch (e) {
      setMensaje(null);
      setError((e as Error).message);
    }
  }

  return (
    <main className="app">
      <header className="cabecera">
        <nav className="secciones">
          <button className={vista === 'figuras' ? 'activa' : ''} onClick={() => setVista('figuras')}>
            Figuras
          </button>
          <button className={vista === 'tiendas' ? 'activa' : ''} onClick={() => setVista('tiendas')}>
            Tiendas
          </button>
        </nav>
        <div className="botones">
          <button className="secundario" onClick={() => selectorExcel.current?.click()}>
            Importar
          </button>
          <input ref={selectorExcel} type="file" accept=".xlsx,.html,.htm" hidden onChange={alElegirExcel} />
          {vista === 'figuras' ? (
            <button className="principal" onClick={() => setEdicionFigura({ modo: 'nueva' })}>
              + Añadir figura
            </button>
          ) : (
            <button className="principal" onClick={() => setEdicionTienda({ tienda: null })}>
              + Añadir tienda
            </button>
          )}
        </div>
      </header>

      {mensaje && (
        <p className="mensaje" role="status">
          {mensaje} <button className="enlace" onClick={() => setMensaje(null)}>Cerrar</button>
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {vista === 'figuras' ? (
        <>
          <nav className="pestanas">
            {estados.map((e) => (
              <button key={e} className={e === estado ? 'activa' : ''} onClick={() => setEstado(e)}>
                {textoEstado[e]}
              </button>
            ))}
          </nav>
          {!error && figuras.length === 0 && <p className="vacio">No hay figuras en esta lista todavía.</p>}
          <section className="rejilla">
            {figuras.map((f) => (
              <TarjetaFigura key={f.id} figura={f} onAbrir={() => setEdicionFigura({ modo: 'editar', figura: f })} />
            ))}
          </section>
        </>
      ) : (
        <ListaTiendas tiendas={tiendas} onAbrir={(t) => setEdicionTienda({ tienda: t })} />
      )}

      {edicionFigura && (
        <FormularioFigura
          key={edicionFigura.modo === 'editar' ? edicionFigura.figura.id : 'nueva'}
          figura={edicionFigura.modo === 'editar' ? edicionFigura.figura : undefined}
          tiendas={tiendas}
          estadoInicial={estado}
          onGuardar={guardarFigura}
          onCrearTienda={crearTiendaRapida}
          onEliminar={edicionFigura.modo === 'editar' ? () => borrarFigura(edicionFigura.figura) : undefined}
          onCancelar={() => setEdicionFigura(null)}
        />
      )}

      {edicionTienda && (
        <FormularioTienda
          key={edicionTienda.tienda?.id ?? 'nueva'}
          tienda={edicionTienda.tienda}
          onGuardar={guardarFichaTienda}
          onEliminar={edicionTienda.tienda ? () => borrarTienda(edicionTienda.tienda!) : undefined}
          onCancelar={() => setEdicionTienda(null)}
        />
      )}
    </main>
  );
}
