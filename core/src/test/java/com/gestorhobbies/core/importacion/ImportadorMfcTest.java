package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImportadorMfcTest {

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

    @Test
    void importaLaPestanaOwnedComoFigurasQueTengo() throws IOException {
        FiguraRepository figuras = mock(FiguraRepository.class);
        String contenido = pagina("2",
                item("1464692", "1464692-48810.jpg",
                        "Hagane no Renkinjutsushi Fullmetal Alchemist - Roy Mustang - Pop Up Parade (Good Smile Company)")
                        + item("1873714", "1873714-7ffc0.jpg",
                        "[Intermediate] - Steins;Gate - Makise Kurisu - Aqua Float Girls (Taito)"));

        ResultadoImportacion resultado = new ImportadorMfc(figuras).importar(html(contenido));

        assertThat(resultado.figurasCreadas()).isEqualTo(2);
        ArgumentCaptor<Figura> captor = ArgumentCaptor.forClass(Figura.class);
        verify(figuras, times(2)).save(captor.capture());

        Figura roy = captor.getAllValues().get(0);
        assertThat(roy.getTitulo())
                .isEqualTo("Hagane no Renkinjutsushi Fullmetal Alchemist - Roy Mustang - Pop Up Parade");
        assertThat(roy.getFabricante()).isEqualTo("Good Smile Company");
        assertThat(roy.getEstado()).isEqualTo(EstadoFigura.LA_TENGO);
        assertThat(roy.getImagenUrl())
                .isEqualTo("https://static.myfigurecollection.net/upload/items/2/1464692-48810.jpg");
        assertThat(roy.getNotas()).contains("https://myfigurecollection.net/item/1464692");

        assertThat(captor.getAllValues().get(1).getTitulo()).isEqualTo("Steins;Gate - Makise Kurisu - Aqua Float Girls");
    }

    @Test
    void laPestanaWishedVaAMeGustaYNoDuplica() throws IOException {
        FiguraRepository figuras = mock(FiguraRepository.class);
        when(figuras.existsByTituloIgnoreCase("Sousou no Frieren - Frieren - Desktop Cute")).thenReturn(true);
        String contenido = pagina("0",
                item("2477095", "2477095-b38c0.jpg", "Sousou no Frieren - Frieren - Desktop Cute (Taito)")
                        + item("2701969", "2701969-0967a.jpg", "Spy × Family - Yor Forger - Luminasta (Sega Fave)"));

        ResultadoImportacion resultado = new ImportadorMfc(figuras).importar(html(contenido));

        assertThat(resultado.figurasCreadas()).isEqualTo(1);
        assertThat(resultado.figurasOmitidas()).isEqualTo(1);
        ArgumentCaptor<Figura> captor = ArgumentCaptor.forClass(Figura.class);
        verify(figuras).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(EstadoFigura.ME_GUSTA);
    }

    @Test
    void rechazaArchivosQueNoSonDeMfc() {
        FiguraRepository figuras = mock(FiguraRepository.class);
        assertThatThrownBy(() -> new ImportadorMfc(figuras).importar(html("<html><body>Hola</body></html>")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
