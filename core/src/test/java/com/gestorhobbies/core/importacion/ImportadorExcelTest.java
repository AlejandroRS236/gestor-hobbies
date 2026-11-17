package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.comun.EstadoEnlace;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraRepository;
import com.gestorhobbies.core.tiendas.Confianza;
import com.gestorhobbies.core.tiendas.Tienda;
import com.gestorhobbies.core.tiendas.TiendaRepository;
import org.apache.poi.common.usermodel.HyperlinkType;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Hyperlink;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImportadorExcelTest {

    private static final String[] CABECERA = {"Figura", "Tienda", "Precio", "Envío est.", "Total", "Salida",
            "Pedir antes de", "Riesgo", "Estado", "Fabricante", "Notas", "Método pago", "Enlace", "Orden",
            "Precio visto", "Comprobado el"};

    private FiguraRepository figuras;
    private TiendaRepository tiendas;
    private ImportadorExcel importador;

    @BeforeEach
    void preparar() {
        figuras = mock(FiguraRepository.class);
        tiendas = mock(TiendaRepository.class);
        when(tiendas.findByNombreIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(tiendas.save(any(Tienda.class))).thenAnswer(inv -> inv.getArgument(0));
        importador = new ImportadorExcel(figuras, tiendas);
    }

    @Test
    void importaFigurasConSusAlternativasYTiendas() throws IOException {
        byte[] excel = libro(
                fila("Coco 1/6 Re-run", "Xtralife", 229.95, 2.99, "Jul 2027", LocalDate.of(2026, 11, 27), "Alto",
                        "Quiero", "quesQ", "Reedición muy buscada. JAN 4571234567890", "Señal de 25 €.",
                        "Xtralife", "https://www.xtralife.com/coco"),
                fila("   ↳ Coco 1/6 Re-run", "Elbenwald (web española)", 239.0, 0.0, "Jul 2027", "Hasta agotar",
                        "Alto", "Alternativa", "quesQ", "Envío gratis desde 70 €.", "Preorder pagada entera.",
                        "Elbenwald", "https://elbenwald.es/coco"),
                fila("   ↳ Coco 1/6 Re-run", "WaifuWorld (Alemania)", 200.0, null, "En stock", "Sin fecha",
                        "Medio", "Descartada", "quesQ", "NO COMPRAR: insolvencia.", null,
                        "WaifuWorld", "https://waifuworld.example/coco"),
                fila("Maomao 1/7", "Figuya (Pre-order o Reserve)", 114.99, 18.9, "Sept 2027", "Sin fecha publicada",
                        "Medio", "Dudo", "Good Smile Company", "RESERVADA el 16/11/2026.", "Reserve gratis.",
                        "Figuya", "https://figuya.com/maomao"));

        ResultadoImportacion resultado = importador.importar(new ByteArrayInputStream(excel));

        assertThat(resultado.figurasCreadas()).isEqualTo(2);
        assertThat(resultado.tiendasCreadas()).isEqualTo(4);
        assertThat(resultado.avisos()).isEmpty();

        ArgumentCaptor<Figura> captor = ArgumentCaptor.forClass(Figura.class);
        verify(figuras, times(2)).save(captor.capture());
        Figura coco = captor.getAllValues().get(0);
        Figura maomao = captor.getAllValues().get(1);

        assertThat(coco.getTitulo()).isEqualTo("Coco 1/6 Re-run");
        assertThat(coco.getEstado()).isEqualTo(EstadoFigura.PENSANDO_COMPRAR);
        assertThat(coco.getJan()).isEqualTo("4571234567890");
        assertThat(coco.getRiesgo()).isEqualTo("Alto");
        assertThat(coco.getEnlaces()).hasSize(3);

        Enlace xtralife = coco.getEnlaces().get(0);
        assertThat(xtralife.getTienda().getNombre()).isEqualTo("Xtralife");
        assertThat(xtralife.getTienda().getCondiciones()).isEqualTo("Señal de 25 €.");
        assertThat(xtralife.getTienda().getEnvioPorDefecto()).isEqualByComparingTo("2.99");
        assertThat(xtralife.getUrl()).isEqualTo("https://www.xtralife.com/coco");
        assertThat(xtralife.total()).isEqualByComparingTo("232.94");
        assertThat(xtralife.getPedirAntesDe()).isEqualTo(LocalDate.of(2026, 11, 27));
        assertThat(xtralife.getSalida()).isEqualTo("Jul 2027");

        Enlace elbenwald = coco.getEnlaces().get(1);
        assertThat(elbenwald.getTienda().getPais()).isEqualTo("España");
        assertThat(elbenwald.getNotas()).contains("Envío gratis desde 70 €.").contains("Pedir antes de: Hasta agotar");

        Enlace waifu = coco.getEnlaces().get(2);
        assertThat(waifu.getEstado()).isEqualTo(EstadoEnlace.DESCARTADA);
        assertThat(waifu.getTienda().getConfianza()).isEqualTo(Confianza.NO_COMPRAR);
        assertThat(waifu.getTienda().getPais()).isEqualTo("Alemania");
        assertThat(coco.enlaceMasBarato()).contains(xtralife);

        assertThat(maomao.getEstado()).isEqualTo(EstadoFigura.DUDO);
        assertThat(maomao.getEnlaces().get(0).getEstado()).isEqualTo(EstadoEnlace.RESERVADA);
        assertThat(maomao.getEnlaces().get(0).getTienda().getNombre()).isEqualTo("Figuya");
    }

    @Test
    void noDuplicaFigurasQueYaExisten() throws IOException {
        when(figuras.existsByTituloIgnoreCase("Coco 1/6 Re-run")).thenReturn(true);
        byte[] excel = libro(
                fila("Coco 1/6 Re-run", "Xtralife", 229.95, 2.99, "Jul 2027", null, "Alto",
                        "Quiero", "quesQ", null, null, "Xtralife", "https://www.xtralife.com/coco"),
                fila("   ↳ Coco 1/6 Re-run", "Elbenwald", 239.0, 0.0, "Jul 2027", null,
                        "Alto", "Alternativa", "quesQ", null, null, "Elbenwald", "https://elbenwald.es/coco"));

        ResultadoImportacion resultado = importador.importar(new ByteArrayInputStream(excel));

        assertThat(resultado.figurasCreadas()).isZero();
        assertThat(resultado.figurasOmitidas()).isEqualTo(1);
        verify(figuras, times(0)).save(any());
    }

    private static Object[] fila(Object... valores) {
        return valores;
    }

    /** Crea un Excel con el mismo formato que la hoja original (columnas A a M). */
    private static byte[] libro(Object[]... filas) throws IOException {
        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Sheet hoja = libro.createSheet("Figuras");
            hoja.createRow(0).createCell(0).setCellValue("Total pendiente (€)");
            Row cabecera = hoja.createRow(2);
            for (int i = 0; i < CABECERA.length; i++) {
                cabecera.createCell(i).setCellValue(CABECERA[i]);
            }
            CreationHelper ayuda = libro.getCreationHelper();
            CellStyle estiloFecha = libro.createCellStyle();
            estiloFecha.setDataFormat(ayuda.createDataFormat().getFormat("dd/mm/yyyy"));

            // Orden de los valores de prueba: figura, tienda, precio, envío, salida, pedir antes de,
            // riesgo, estado, fabricante, notas, método de pago, texto del enlace, URL.
            int[] columnas = {0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12};
            int numero = 3;
            for (Object[] valores : filas) {
                Row fila = hoja.createRow(numero++);
                for (int i = 0; i < columnas.length; i++) {
                    Object valor = valores[i];
                    if (valor == null) {
                        continue;
                    }
                    Cell celda = fila.createCell(columnas[i]);
                    if (valor instanceof Double d) {
                        celda.setCellValue(d);
                    } else if (valor instanceof LocalDate f) {
                        celda.setCellValue(f);
                        celda.setCellStyle(estiloFecha);
                    } else {
                        celda.setCellValue(valor.toString());
                    }
                }
                Hyperlink enlace = ayuda.createHyperlink(HyperlinkType.URL);
                enlace.setAddress((String) valores[12]);
                fila.getCell(12).setHyperlink(enlace);
            }
            libro.write(salida);
            return salida.toByteArray();
        }
    }

    @SuppressWarnings("unused")
    private static List<String> nombres(List<Enlace> enlaces) {
        return enlaces.stream().map(e -> e.getTienda().getNombre()).toList();
    }
}
