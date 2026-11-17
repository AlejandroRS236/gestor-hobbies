package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.figuras.DatosFicha;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraRepository;
import com.gestorhobbies.core.importacion.ImportadorMfc.Accion;
import com.gestorhobbies.core.importacion.ImportadorMfc.Candidato;
import com.gestorhobbies.core.importacion.ImportadorMfc.Decision;
import com.gestorhobbies.core.importacion.ImportadorMfc.Previsualizacion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImportadorMfcTest {

    private FiguraRepository figuras;
    private ImportadorMfc importador;

    @BeforeEach
    void preparar() {
        figuras = mock(FiguraRepository.class);
        importador = new ImportadorMfc(figuras);
    }

    private static String pagina(String status, String items) {
        return """
                <html><body>
                <div class="tabs result-tabs">
                  <div class="tab"><a href="https://myfigurecollection.net/?mode=view&amp;status=2" class="%s">Owned</a></div>
                  <div class="tab"><a href="https://myfigurecollection.net/?mode=view&amp;status=1" class="%s">Ordered</a></div>
                  <div class="tab"><a href="https://myfigurecollection.net/?mode=view&amp;status=0" class="%s">Wished</a></div>
                </div>
                <div class="results">%s</div>
                </body></html>
                """.formatted(
                "2".equals(status) ? " selected" : "",
                "1".equals(status) ? " selected" : "",
                "0".equals(status) ? " selected" : "",
                items);
    }

    private static String item(String id, String imagen, String alt) {
        return """
                <span class="item-icon"><a href="https://myfigurecollection.net/item/%s" class="anchor">
                <img src="./Coleccion_files/%s" alt="%s"></a></span>
                """.formatted(id, imagen, alt);
    }

    private static ByteArrayInputStream html(String contenido) {
        return new ByteArrayInputStream(contenido.getBytes(StandardCharsets.UTF_8));
    }

    private static Figura existente(long id, String titulo) {
        Figura f = new Figura(titulo, EstadoFigura.PENSANDO_COMPRAR);
        ReflectionTestUtils.setField(f, "id", id);
        return f;
    }

    @Test
    void leeLaPestanaYLosDatosDeCadaFigura() throws IOException {
        when(figuras.findAll()).thenReturn(List.of());
        String contenido = pagina("2",
                item("1464692", "1464692-48810.jpg",
                        "Hagane no Renkinjutsushi Fullmetal Alchemist - Roy Mustang - Pop Up Parade (Good Smile Company)")
                        + item("1873714", "1873714-7ffc0.jpg",
                        "[Intermediate] - Steins;Gate - Makise Kurisu - Aqua Float Girls (Taito)"));

        Previsualizacion vista = importador.previsualizar(html(contenido));

        assertThat(vista.estado()).isEqualTo(EstadoFigura.LA_TENGO);
        assertThat(vista.candidatos()).hasSize(2);
        Candidato roy = vista.candidatos().get(0);
        assertThat(roy.titulo()).isEqualTo("Hagane no Renkinjutsushi Fullmetal Alchemist - Roy Mustang - Pop Up Parade");
        assertThat(roy.fabricante()).isEqualTo("Good Smile Company");
        assertThat(roy.imagenUrl()).isEqualTo("https://static.myfigurecollection.net/upload/items/1/1464692-48810.jpg");
        assertThat(roy.sugeridaId()).isNull();
        assertThat(vista.candidatos().get(1).titulo()).isEqualTo("Steins;Gate - Makise Kurisu - Aqua Float Girls");
    }

    @Test
    void sugiereLaFiguraExistenteMasParecidaSinRepetirla() throws IOException {
        when(figuras.findAll()).thenReturn(List.of(
                existente(1, "Kurisu Makise – Racing 1/7"),
                existente(2, "Kurisu Makise – Swimsuit Ver. 1/7"),
                existente(3, "Coco 1/6 (Witch Hat Atelier) Re-run")));
        String contenido = pagina("0",
                item("2007474", "2007474-aaa.jpg", "Steins;Gate - Makise Kurisu - 1/7 - Racing Ver. (Solarain)")
                        + item("2007467", "2007467-bbb.jpg", "Steins;Gate - Makise Kurisu - 1/7 - Swimsuit Ver. (Solarain)")
                        + item("806111", "806111-ccc.jpg", "Tongari Boushi no Atelier - Coco - 1/6 (quesQ)")
                        + item("2477095", "2477095-ddd.jpg", "Sousou no Frieren - Frieren - Desktop Cute (Taito)"));

        Previsualizacion vista = importador.previsualizar(html(contenido));

        assertThat(vista.estado()).isEqualTo(EstadoFigura.ME_GUSTA);
        assertThat(vista.candidatos()).extracting(Candidato::sugeridaId).containsExactly(1L, 2L, 3L, null);
    }

    @Test
    void reconoceLasFigurasYaImportadasPorSuEnlace() throws IOException {
        Figura ya = existente(9, "Otro nombre cualquiera");
        ya.setNotas("MyFigureCollection: https://myfigurecollection.net/item/2477095");
        when(figuras.findAll()).thenReturn(List.of(ya));
        String contenido = pagina("0", item("2477095", "2477095-ddd.jpg", "Sousou no Frieren - Frieren (Taito)"));

        Candidato frieren = importador.previsualizar(html(contenido)).candidatos().get(0);

        assertThat(frieren.yaImportada()).isTrue();
        assertThat(frieren.sugeridaId()).isEqualTo(9L);
    }

    @Test
    void creaFusionaYOmiteSegunLoDecidido() {
        Figura racing = existente(1, "Kurisu Makise – Racing 1/7");
        racing.setNotas("La favorita.");
        when(figuras.findById(1L)).thenReturn(Optional.of(racing));
        DatosFicha ficha = new DatosFicha("Prepainted", "Steins;Gate", "Makise Kurisu", "Racing Ver.", "1/7",
                243, null, "ABS, PVC", null, List.of(new DatosFicha.DatosParticipante("Solarain", "Manufacturer")),
                List.of());

        ResultadoImportacion resultado = importador.aplicar(EstadoFigura.ME_GUSTA, List.of(
                new Decision("2007474", "Kurisu Racing", "Solarain", "https://img/racing.jpg", "4595316221721",
                        ficha, Accion.FUSIONAR, 1L),
                new Decision("2477095", "Frieren", "Taito", "https://img/frieren.jpg", null, null, Accion.CREAR, null),
                new Decision("1", "Omitida", null, null, null, null, Accion.OMITIR, null)));

        assertThat(resultado.figurasCreadas()).isEqualTo(1);
        assertThat(resultado.figurasOmitidas()).isEqualTo(1);
        assertThat(racing.getTitulo()).isEqualTo("Kurisu Makise – Racing 1/7");
        assertThat(racing.getImagenUrl()).isEqualTo("https://img/racing.jpg");
        assertThat(racing.getFabricante()).isEqualTo("Solarain");
        assertThat(racing.getNotas()).isEqualTo("La favorita.");
        assertThat(racing.getMfcId()).isEqualTo("2007474");
        assertThat(racing.getJan()).isEqualTo("4595316221721");
        assertThat(racing.datosFicha().alturaMm()).isEqualTo(243);
        assertThat(racing.datosFicha().participantes()).hasSize(1);

        ArgumentCaptor<Figura> captor = ArgumentCaptor.forClass(Figura.class);
        verify(figuras).save(captor.capture());
        assertThat(captor.getValue().getTitulo()).isEqualTo("Frieren");
        assertThat(captor.getValue().getEstado()).isEqualTo(EstadoFigura.ME_GUSTA);
        assertThat(captor.getValue().getMfcId()).isEqualTo("2477095");
    }

    @Test
    void noSugiereFigurasYaEnlazadasConOtraDeMfc() throws IOException {
        Figura shiroWallapop = existente(5, "Shiro (No Game No Life) 1/7");
        shiroWallapop.setMfcId("218050");
        when(figuras.findAll()).thenReturn(List.of(shiroWallapop));
        String contenido = pagina("0", item("3547024", "3547024-abc.jpg", "No Game No Life - Shiro - 1/7 - Black (Kotobukiya)"));

        Candidato black = importador.previsualizar(html(contenido)).candidatos().get(0);

        assertThat(black.sugeridaId()).isNull();
    }

    @Test
    void laPaginaDeUnaFiguraTraeSuFichaYSugiereLaExistente() throws IOException {
        when(figuras.findAll()).thenReturn(List.of(existente(3, "Kurisu Makise – Racing 1/7")));
        try (var html = getClass().getResourceAsStream("/mfc/figura-racing.html")) {
            Previsualizacion vista = importador.previsualizar(html);

            assertThat(vista.candidatos()).hasSize(1);
            Candidato racing = vista.candidatos().get(0);
            assertThat(racing.ficha()).isNotNull();
            assertThat(racing.ficha().alturaMm()).isEqualTo(243);
            assertThat(racing.sugeridaId()).isEqualTo(3L);
        }
    }

    @Test
    void rechazaArchivosQueNoSonDeMfc() {
        assertThatThrownBy(() -> importador.previsualizar(html("<html><body>Hola</body></html>")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(figuras, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
