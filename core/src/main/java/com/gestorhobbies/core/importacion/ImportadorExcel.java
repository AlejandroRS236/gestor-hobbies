package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.comun.EstadoEnlace;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraRepository;
import com.gestorhobbies.core.tiendas.Confianza;
import com.gestorhobbies.core.tiendas.Tienda;
import com.gestorhobbies.core.tiendas.TiendaRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Importa la hoja de cálculo de figuras que usaba antes de la app.
 *
 * <p>Formato esperado: una fila de cabecera que empieza por "Figura" y debajo
 * una fila por figura. Las filas cuyo nombre empieza por "↳" son alternativas
 * de la figura anterior en otras tiendas.</p>
 */
@Service
public class ImportadorExcel {

    private static final String MARCA_ALTERNATIVA = "↳";
    private static final Pattern CODIGO_JAN = Pattern.compile("(?:JAN|EAN)\\s*:?\\s*(\\d{13}|\\d{8})\\b");
    private static final Pattern RESERVADA = Pattern.compile("\\bRESERVADA\\b");
    private static final Pattern PARENTESIS = Pattern.compile("\\s*\\(([^)]*)\\)\\s*$");
    private static final Set<String> PAISES = Set.of("España", "Francia", "Italia", "Alemania", "Japón",
            "Reino Unido", "Portugal", "Países Bajos", "Bélgica", "Chequia", "Eslovaquia");

    private final FiguraRepository figuras;
    private final TiendaRepository tiendas;
    private final DataFormatter formato = new DataFormatter(Locale.forLanguageTag("es-ES"));

    public ImportadorExcel(FiguraRepository figuras, TiendaRepository tiendas) {
        this.figuras = figuras;
        this.tiendas = tiendas;
    }

    @Transactional
    public ResultadoImportacion importar(InputStream excel) throws IOException {
        try (Workbook libro = WorkbookFactory.create(excel)) {
            return new Importacion().procesar(buscarHoja(libro));
        }
    }

    private Sheet buscarHoja(Workbook libro) {
        for (Sheet hoja : libro) {
            if (buscarCabecera(hoja) != null) {
                return hoja;
            }
        }
        throw new IllegalArgumentException("No encuentro ninguna hoja con una columna \"Figura\" en la cabecera");
    }

    private Row buscarCabecera(Sheet hoja) {
        for (Row fila : hoja) {
            if ("Figura".equalsIgnoreCase(texto(fila.getCell(0)))) {
                return fila;
            }
        }
        return null;
    }

    /** Estado de una sola importación: columnas, tiendas ya vistas y contadores. */
    private final class Importacion {

        private final Map<String, Integer> columnas = new HashMap<>();
        private final Map<String, Tienda> tiendasVistas = new HashMap<>();
        private final List<String> avisos = new ArrayList<>();
        private int creadas;
        private int omitidas;
        private int tiendasCreadas;

        ResultadoImportacion procesar(Sheet hoja) {
            Row cabecera = buscarCabecera(hoja);
            for (Cell celda : cabecera) {
                columnas.put(normalizar(texto(celda)), celda.getColumnIndex());
            }

            Figura actual = null;
            boolean saltandoActual = false;
            for (int i = cabecera.getRowNum() + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                String nombre = fila == null ? "" : texto(fila.getCell(0));
                if (nombre.isBlank()) {
                    continue;
                }
                if (nombre.strip().startsWith(MARCA_ALTERNATIVA)) {
                    if (saltandoActual) {
                        continue;
                    }
                    if (actual == null) {
                        avisos.add("Fila " + (i + 1) + ": alternativa sin figura principal, se ignora");
                        continue;
                    }
                    actual.anadirEnlace(crearEnlace(fila, true));
                    buscarJan(actual, columna(fila, "notas"));
                    continue;
                }

                guardar(actual);
                String titulo = nombre.strip();
                if (figuras.existsByTituloIgnoreCase(titulo)) {
                    omitidas++;
                    actual = null;
                    saltandoActual = true;
                    continue;
                }
                saltandoActual = false;
                actual = crearFigura(fila, titulo, i);
            }
            guardar(actual);
            return new ResultadoImportacion(creadas, omitidas, tiendasCreadas, List.copyOf(avisos));
        }

        private void guardar(Figura figura) {
            if (figura != null) {
                figuras.save(figura);
                creadas++;
            }
        }

        private Figura crearFigura(Row fila, String titulo, int indice) {
            Figura figura = new Figura(titulo, estadoFigura(texto(columna(fila, "estado")), indice));
            figura.setFabricante(vacioANull(texto(columna(fila, "fabricante"))));
            figura.setRiesgo(vacioANull(texto(columna(fila, "riesgo"))));
            figura.setNotas(vacioANull(texto(columna(fila, "notas"))));
            buscarJan(figura, columna(fila, "notas"));

            Enlace principal = crearEnlace(fila, false);
            if (figura.getEstado() == EstadoFigura.RESERVADA || figura.getEstado() == EstadoFigura.LA_TENGO) {
                principal.setEstado(EstadoEnlace.RESERVADA);
            }
            figura.anadirEnlace(principal);
            return figura;
        }

        private Enlace crearEnlace(Row fila, boolean alternativa) {
            Cell celdaEnlace = columna(fila, "enlace");
            String tiendaColumna = texto(columna(fila, "tienda"));
            String nombreTienda = texto(celdaEnlace);
            if (nombreTienda.isBlank()) {
                nombreTienda = PARENTESIS.matcher(tiendaColumna).replaceFirst("");
            }
            String condiciones = vacioANull(texto(columna(fila, "metodo pago")));
            BigDecimal envio = numero(columna(fila, "envio"));
            Tienda tienda = tienda(nombreTienda, tiendaColumna, condiciones, envio);

            String url = celdaEnlace != null && celdaEnlace.getHyperlink() != null
                    ? celdaEnlace.getHyperlink().getAddress() : null;
            Enlace enlace = new Enlace(tienda, url, numero(columna(fila, "precio")), envio);
            enlace.setSalida(vacioANull(texto(columna(fila, "salida"))));
            enlace.setPrecioVisto(numero(columna(fila, "precio visto")));
            enlace.setComprobadoEl(fecha(columna(fila, "comprobado")));

            String notasFila = vacioANull(texto(columna(fila, "notas")));
            String notas = alternativa ? notasFila : null;
            Cell pedirAntes = columna(fila, "pedir antes");
            LocalDate limite = fecha(pedirAntes);
            if (limite != null) {
                enlace.setPedirAntesDe(limite);
            } else if (!texto(pedirAntes).isBlank()) {
                notas = unir(notas, "Pedir antes de: " + texto(pedirAntes));
            }
            enlace.setNotas(notas);

            String estadoFila = texto(columna(fila, "estado"));
            if (alternativa && "Descartada".equalsIgnoreCase(estadoFila)) {
                enlace.setEstado(EstadoEnlace.DESCARTADA);
                if (notas != null && notas.toUpperCase(Locale.ROOT).startsWith("NO COMPRAR")) {
                    tienda.setConfianza(Confianza.NO_COMPRAR);
                }
            } else if (notasFila != null && RESERVADA.matcher(notasFila).find()) {
                enlace.setEstado(EstadoEnlace.RESERVADA);
            }
            return enlace;
        }

        private Tienda tienda(String nombre, String tiendaColumna, String condiciones, BigDecimal envio) {
            String clave = nombre.strip().toLowerCase(Locale.ROOT);
            Tienda tienda = tiendasVistas.computeIfAbsent(clave, k -> tiendas.findByNombreIgnoreCase(nombre.strip())
                    .orElseGet(() -> {
                        tiendasCreadas++;
                        return tiendas.save(new Tienda(nombre));
                    }));
            if (tienda.getCondiciones() == null && condiciones != null) {
                tienda.setCondiciones(condiciones);
            }
            if (tienda.getEnvioPorDefecto() == null && envio != null) {
                tienda.setEnvioPorDefecto(envio);
            }
            if (tienda.getPais() == null) {
                tienda.setPais(pais(tiendaColumna));
            }
            return tienda;
        }

        private Cell columna(Row fila, String nombre) {
            Integer indice = columnas.get(nombre);
            if (indice == null) {
                indice = columnas.entrySet().stream()
                        .filter(e -> e.getKey().startsWith(nombre))
                        .map(Map.Entry::getValue)
                        .findFirst()
                        .orElse(null);
            }
            return indice == null ? null : fila.getCell(indice);
        }

        private EstadoFigura estadoFigura(String estado, int indice) {
            return switch (normalizar(estado)) {
                case "quiero", "" -> EstadoFigura.PENSANDO_COMPRAR;
                case "dudo" -> EstadoFigura.DUDO;
                case "pagada", "reservada" -> EstadoFigura.RESERVADA;
                case "comprada", "la tengo" -> EstadoFigura.LA_TENGO;
                case "descartada" -> EstadoFigura.DESCARTADA;
                case "me gusta" -> EstadoFigura.ME_GUSTA;
                default -> {
                    avisos.add("Fila " + (indice + 1) + ": estado \"" + estado
                            + "\" desconocido, la pongo en Pensando comprar");
                    yield EstadoFigura.PENSANDO_COMPRAR;
                }
            };
        }

        private void buscarJan(Figura figura, Cell notas) {
            if (figura.getJan() != null) {
                return;
            }
            Matcher m = CODIGO_JAN.matcher(texto(notas));
            if (m.find()) {
                figura.setJan(m.group(1));
            }
        }
    }

    private String texto(Cell celda) {
        return celda == null ? "" : formato.formatCellValue(celda).strip();
    }

    private static boolean esNumerica(Cell celda) {
        if (celda == null) {
            return false;
        }
        CellType tipo = celda.getCellType() == CellType.FORMULA ? celda.getCachedFormulaResultType() : celda.getCellType();
        return tipo == CellType.NUMERIC;
    }

    private static BigDecimal numero(Cell celda) {
        if (!esNumerica(celda) || DateUtil.isCellDateFormatted(celda)) {
            return null;
        }
        return BigDecimal.valueOf(celda.getNumericCellValue()).setScale(2, RoundingMode.HALF_UP);
    }

    private static LocalDate fecha(Cell celda) {
        if (!esNumerica(celda) || !DateUtil.isCellDateFormatted(celda)) {
            return null;
        }
        return celda.getLocalDateTimeCellValue().toLocalDate();
    }

    private static String pais(String tiendaColumna) {
        Matcher m = PARENTESIS.matcher(tiendaColumna);
        if (!m.find()) {
            return null;
        }
        String dentro = m.group(1).strip();
        if (dentro.toLowerCase(Locale.ROOT).contains("española")) {
            return "España";
        }
        return PAISES.contains(dentro) ? dentro : null;
    }

    private static String normalizar(String texto) {
        return java.text.Normalizer.normalize(texto.strip().toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ");
    }

    private static String vacioANull(String texto) {
        return texto == null || texto.isBlank() ? null : texto;
    }

    private static String unir(String a, String b) {
        return a == null ? b : a + "\n" + b;
    }
}
