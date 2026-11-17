import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  actualizarFigura, crearFigura, eliminarFigura, eliminarTienda, guardarTienda, importarExcel, aplicarMfc, previsualizarMfc,
  listarFiguras, listarTiendas,
} from './api';
import { FormularioFigura } from './components/FormularioFigura';
import { FormularioTienda } from './components/FormularioTienda';
import { ListaTiendas } from './components/ListaTiendas';
import { RevisionMfc } from './components/RevisionMfc';
import { TarjetaFigura } from './components/TarjetaFigura';
import type {
  DecisionMfc, EstadoFigura, Figura, FiguraPeticion, PrevisualizacionMfc, ResultadoImportacion, Tienda,
} from './tipos';
import { estados, textoEstado } from './tipos';

type Vista = 'figuras' | 'tiendas';
type Filtro = EstadoFigura | 'TODAS';
type EdicionFigura = { modo: 'nueva' } | { modo: 'editar'; figura: Figura } | null;
type EdicionTienda = { tienda: Tienda | null } | null;

export default function App() {
  const [vista, setVista] = useState<Vista>('figuras');
  const [estado, setEstado] = useState<Filtro>('TODAS');
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [edicionFigura, setEdicionFigura] = useState<EdicionFigura>(null);
  const [edicionTienda, setEdicionTienda] = useState<EdicionTienda>(null);
  const [revisionMfc, setRevisionMfc] = useState<{ vista: PrevisualizacionMfc; todas: Figura[] } | null>(null);
  const selectorExcel = useRef<HTMLInputElement>(null);

  const cargarFiguras = useCallback(async () => {
    try {
      setFiguras(await listarFiguras(estado === 'TODAS' ? undefined : estado));
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
    if (estado !== 'TODAS' && datos.estado !== estado) {
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

  function mostrarResultado(r: ResultadoImportacion) {
    const partes = [`${r.figurasCreadas} figuras importadas`];
    if (r.tiendasCreadas > 0) partes.push(`${r.tiendasCreadas} tiendas nuevas`);
    if (r.figurasOmitidas > 0) partes.push(`${r.figurasOmitidas} sin importar`);
    setMensaje(partes.join(', ') + '.' + (r.avisos.length ? ` ${r.avisos.join(' · ')}` : ''));
  }

  async function alElegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setMensaje('Leyendo el archivo…');
    try {
      if (/\.html?$/i.test(archivo.name)) {
        const [vista, todas] = await Promise.all([previsualizarMfc(archivo), listarFiguras()]);
        setMensaje(null);
        setRevisionMfc({ vista, todas });
      } else {
        mostrarResultado(await importarExcel(archivo));
        await Promise.all([cargarFiguras(), cargarTiendas()]);
      }
    } catch (e) {
      setMensaje(null);
      setError((e as Error).message);
    }
  }

  async function confirmarMfc(decisiones: DecisionMfc[]) {
    if (!revisionMfc) return;
    const r = await aplicarMfc(revisionMfc.vista.estado, decisiones);
    setRevisionMfc(null);
    mostrarResultado(r);
    await cargarFiguras();
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
          <input ref={selectorExcel} type="file" accept=".xlsx,.html,.htm" hidden onChange={alElegirArchivo} />
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
            <button className={estado === 'TODAS' ? 'activa' : ''} onClick={() => setEstado('TODAS')}>
              Todas
            </button>
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
          estadoInicial={estado === 'TODAS' ? 'PENSANDO_COMPRAR' : estado}
          onGuardar={guardarFigura}
          onCrearTienda={crearTiendaRapida}
          onEliminar={edicionFigura.modo === 'editar' ? () => borrarFigura(edicionFigura.figura) : undefined}
          onCancelar={() => setEdicionFigura(null)}
        />
      )}

      {revisionMfc && (
        <RevisionMfc
          vista={revisionMfc.vista}
          figuras={revisionMfc.todas}
          onConfirmar={confirmarMfc}
          onCancelar={() => setRevisionMfc(null)}
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
