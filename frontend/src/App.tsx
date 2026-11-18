import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  actualizarFigura, crearFigura, eliminarFigura, eliminarTienda, guardarTienda, importarExcel, aplicarMfc, previsualizarMfc,
  listarFiguras, listarTiendas, obtenerPerfil, guardarPerfil, ultimasActualizaciones,
} from './api';
import { FormularioPerfil } from './components/FormularioPerfil';
import { Inicio } from './components/Inicio';
import { PerfilFiguras } from './components/PerfilFiguras';
import { FormularioFigura } from './components/FormularioFigura';
import { FormularioTienda } from './components/FormularioTienda';
import { ListaTiendas } from './components/ListaTiendas';
import { BarraFiltros } from './components/BarraFiltros';
import { RevisionMfc } from './components/RevisionMfc';
import type { DecisionConEstado } from './components/RevisionMfc';
import { aplicarFiltros, filtrosVacios, porEstado, resumir } from './filtrado';
import type { Filtros } from './filtrado';
import { formatearEuros } from './formato';
import { TarjetaFigura } from './components/TarjetaFigura';
import type {
  Actualizacion, EstadoFigura, Figura, FiguraPeticion, Perfil, PrevisualizacionMfc, ResultadoImportacion, Tienda,
} from './tipos';
import { estados, textoEstado } from './tipos';

type Vista = 'inicio' | 'perfil-figuras' | 'figuras' | 'tiendas';
type Filtro = EstadoFigura | 'TODAS';
type EdicionFigura = { modo: 'nueva' } | { modo: 'editar'; figura: Figura } | null;
type EdicionTienda = { tienda: Tienda | null } | null;

export default function App() {
  const [vista, setVista] = useState<Vista>('inicio');
  const [perfil, setPerfil] = useState<Perfil>({ nombre: null, avatarUrl: null, fondoUrl: null });
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [actualizaciones, setActualizaciones] = useState<Actualizacion[]>([]);
  const [estado, setEstado] = useState<Filtro>('TODAS');
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [edicionFigura, setEdicionFigura] = useState<EdicionFigura>(null);
  const [edicionTienda, setEdicionTienda] = useState<EdicionTienda>(null);
  const [revisionMfc, setRevisionMfc] = useState<{ vistas: PrevisualizacionMfc[]; todas: Figura[] } | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(filtrosVacios);
  const selectorExcel = useRef<HTMLInputElement>(null);

  const cargarFiguras = useCallback(async () => {
    try {
      const [lista, cambios] = await Promise.all([listarFiguras(), ultimasActualizaciones()]);
      setFiguras(lista);
      setActualizaciones(cambios);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

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

  useEffect(() => {
    obtenerPerfil().then(setPerfil).catch(() => undefined);
  }, []);

  async function guardarDatosPerfil(datos: Perfil) {
    setPerfil(await guardarPerfil(datos));
    setEditandoPerfil(false);
  }

  function verLista(filtro: Filtro) {
    setEstado(filtro);
    setVista('figuras');
  }

  function abrirFigura(figura: Figura) {
    setEdicionFigura({ modo: 'editar', figura });
  }

  async function guardarFigura(datos: FiguraPeticion) {
    if (edicionFigura?.modo === 'editar') {
      await actualizarFigura(edicionFigura.figura.id, datos);
    } else {
      await crearFigura(datos);
    }
    setEdicionFigura(null);
    await cargarFiguras();
    if (estado !== 'TODAS' && datos.estado !== estado) {
      setEstado(datos.estado);
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
    const archivos = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    if (archivos.length === 0) return;
    const html = archivos.filter((a) => /\.html?$/i.test(a.name));
    const excel = archivos.filter((a) => !/\.html?$/i.test(a.name));
    setMensaje(archivos.length > 1 ? `Leyendo ${archivos.length} archivos…` : 'Leyendo el archivo…');
    try {
      for (const archivo of excel) {
        mostrarResultado(await importarExcel(archivo));
      }
      if (excel.length > 0) {
        await Promise.all([cargarFiguras(), cargarTiendas()]);
      }
      if (html.length > 0) {
        const vistas = [];
        for (const archivo of html) {
          vistas.push(await previsualizarMfc(archivo));
        }
        setMensaje(null);
        setRevisionMfc({ vistas, todas: await listarFiguras() });
      }
    } catch (e) {
      setMensaje(null);
      setError((e as Error).message);
    }
  }

  async function confirmarMfc(decisiones: DecisionConEstado[]) {
    const estadosUsados = [...new Set(decisiones.map((d) => d.estado))];
    const total: ResultadoImportacion = { figurasCreadas: 0, figurasOmitidas: 0, tiendasCreadas: 0, avisos: [] };
    for (const estadoGrupo of estadosUsados) {
      const r = await aplicarMfc(estadoGrupo, decisiones.filter((d) => d.estado === estadoGrupo).map((d) => d.decision));
      total.figurasCreadas += r.figurasCreadas;
      total.figurasOmitidas += r.figurasOmitidas;
      total.avisos.push(...r.avisos);
    }
    setRevisionMfc(null);
    mostrarResultado(total);
    await cargarFiguras();
  }

  const visibles = aplicarFiltros(porEstado(figuras, estado), filtros);
  const resumen = resumir(visibles);

  const navegar = (destino: Vista) => () => setVista(destino);

  return (
    <>
      <header className="barra-superior">
        <button type="button" className="marca" onClick={navegar('inicio')} title="Ir al inicio">
          Gestor de hobbies
        </button>
      </header>
      <input ref={selectorExcel} type="file" accept=".xlsx,.html,.htm" multiple hidden onChange={alElegirArchivo} />

    <main className={vista === 'inicio' || vista === 'perfil-figuras' ? '' : 'app'}>
      {mensaje && (
        <p className="mensaje" role="status">
          {mensaje} <button className="enlace" onClick={() => setMensaje(null)}>Cerrar</button>
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {vista === 'inicio' && (
        <Inicio perfil={perfil} figuras={figuras} onAbrirFiguras={navegar('perfil-figuras')}
          onEditarPerfil={() => setEditandoPerfil(true)} />
      )}

      {vista !== 'inicio' && (
        <div className="barra-acciones">
          {vista === 'perfil-figuras' ? (
            <button className="volver" onClick={navegar('inicio')}>← Inicio</button>
          ) : (
            <button className="volver" onClick={navegar('perfil-figuras')}>← Perfil de figuras</button>
          )}
          <h1>{vista === 'tiendas' ? 'Tiendas' : vista === 'figuras' ? 'Lista de figuras' : 'Figuras'}</h1>
          {vista === 'perfil-figuras' && (
            <button className="secundario junto-titulo" onClick={navegar('tiendas')}>Tiendas</button>
          )}
          <span className="espacio" />
          {vista !== 'tiendas' && (
            <button className="secundario" onClick={() => selectorExcel.current?.click()}>Importar</button>
          )}
          {vista === 'tiendas' ? (
            <button className="principal" onClick={() => setEdicionTienda({ tienda: null })}>+ Añadir tienda</button>
          ) : (
            <button className="principal" onClick={() => setEdicionFigura({ modo: 'nueva' })}>+ Añadir figura</button>
          )}
        </div>
      )}

      {vista === 'perfil-figuras' && (
        <PerfilFiguras figuras={figuras} actualizaciones={actualizaciones} perfil={perfil}
          onVerLista={verLista} onAbrirFigura={abrirFigura} onCambiarFondo={() => setEditandoPerfil(true)} />
      )}

      {vista === 'figuras' && (
        <>
          <nav className="pestanas">
            {(['TODAS', ...estados] as Filtro[]).map((e) => (
              <button key={e} className={e === estado ? 'activa' : ''} onClick={() => setEstado(e)}>
                {e === 'TODAS' ? 'Todas' : textoEstado[e]}
                <span className="contador">{porEstado(figuras, e).length}</span>
              </button>
            ))}
          </nav>

          <BarraFiltros figuras={figuras} filtros={filtros} onCambiar={setFiltros} />

          <p className="resumen" aria-live="polite">
            <strong>{visibles.length}</strong> {visibles.length === 1 ? 'figura' : 'figuras'}
            <span className="separador">·</span>
            Total <strong>{formatearEuros(resumen.total)}</strong>
            {resumen.sinPrecio > 0 && (
              <span className="pista"> ({resumen.sinPrecio} sin precio, no cuentan)</span>
            )}
          </p>

          {!error && visibles.length === 0 && (
            <p className="vacio">
              {figuras.length === 0 ? 'Todavía no hay figuras.' : 'Ninguna figura cumple estos filtros.'}
            </p>
          )}
          <section className="rejilla">
            {visibles.map((f) => (
              <TarjetaFigura key={f.id} figura={f} onAbrir={() => setEdicionFigura({ modo: 'editar', figura: f })} />
            ))}
          </section>
        </>
      )}

      {vista === 'tiendas' && (
        <ListaTiendas tiendas={tiendas} onAbrir={(t) => setEdicionTienda({ tienda: t })} />
      )}

      {editandoPerfil && (
        <FormularioPerfil perfil={perfil} onGuardar={guardarDatosPerfil} onCancelar={() => setEditandoPerfil(false)} />
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
          vistas={revisionMfc.vistas}
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
    </>
  );
}
