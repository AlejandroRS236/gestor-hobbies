package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.figuras.DatosFicha;
import com.gestorhobbies.core.figuras.DatosFicha.DatosLanzamiento;
import com.gestorhobbies.core.figuras.DatosFicha.DatosParticipante;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

class LectorFichaMfcTest {

    private static Document pagina(String nombre) throws IOException {
        try (InputStream html = LectorFichaMfcTest.class.getResourceAsStream("/mfc/" + nombre)) {
            return Jsoup.parse(html, "UTF-8", "https://myfigurecollection.net/");
        }
    }

    @Test
    void leeLaFichaCompletaDeLaKurisuRacing() throws IOException {
        Document doc = pagina("figura-racing.html");
        assertThat(LectorFichaMfc.esPaginaDeFigura(doc)).isTrue();

        LectorFichaMfc.FichaMfc leida = LectorFichaMfc.leer(doc);

        assertThat(leida.mfcId()).isEqualTo("2007474");
        assertThat(leida.titulo()).isEqualTo("Steins;Gate - Makise Kurisu - 1/7 - Racing Ver.");
        assertThat(leida.fabricante()).isEqualTo("Solarain");
        assertThat(leida.imagenUrl()).isEqualTo("https://static.myfigurecollection.net/upload/items/1/2007474-3ad6e.jpg");
        assertThat(leida.jan()).isEqualTo("4595316221721");

        DatosFicha ficha = leida.ficha();
        assertThat(ficha.categoria()).isEqualTo("Prepainted");
        assertThat(ficha.serie()).isEqualTo("Steins;Gate");
        assertThat(ficha.personaje()).isEqualTo("Makise Kurisu");
        assertThat(ficha.version()).isEqualTo("Racing Ver.");
        assertThat(ficha.escala()).isEqualTo("1/7");
        assertThat(ficha.alturaMm()).isEqualTo(243);
        assertThat(ficha.materiales()).isEqualTo("ABS, PVC");
        assertThat(ficha.participantes()).containsExactly(
                new DatosParticipante("Solarain", "Manufacturer"),
                new DatosParticipante("PhS' worm", "Sculptor"),
                new DatosParticipante("Yuan Yuan Xiao", "Color producer"));

        assertThat(ficha.lanzamientos()).hasSize(4);
        DatosLanzamiento japon = ficha.lanzamientos().get(0);
        assertThat(japon.fecha()).isEqualTo("09/2027");
        assertThat(japon.edicion()).isEqualTo("Standard (Japan)");
        assertThat(japon.precio()).isEqualByComparingTo("25000");
        assertThat(japon.moneda()).isEqualTo("JPY");
        assertThat(japon.jan()).isEqualTo("4595316221721");
        assertThat(ficha.lanzamientos().get(2).moneda()).isEqualTo("CNY");
        assertThat(ficha.lanzamientos().get(2).precio()).isEqualByComparingTo("899.00");
    }

    @Test
    void recogeElAvisoDeFalsificacionesDeLaShiro() throws IOException {
        LectorFichaMfc.FichaMfc shiro = LectorFichaMfc.leer(pagina("figura-shiro.html"));

        assertThat(shiro.mfcId()).isEqualTo("218050");
        assertThat(shiro.titulo()).isEqualTo("No Game No Life - Shiro - 1/7");
        assertThat(shiro.ficha().alturaMm()).isEqualTo(155);
        assertThat(shiro.ficha().avisos()).contains("counterfeit");
        assertThat(shiro.ficha().participantes()).extracting(DatosParticipante::rol)
                .contains("Manufacturer", "Sculptor", "Illustrator");
    }

    @Test
    void unaPaginaDeColeccionNoEsUnaFicha() {
        Document coleccion = Jsoup.parse("<html><body><div class='result-tabs'></div></body></html>");
        assertThat(LectorFichaMfc.esPaginaDeFigura(coleccion)).isFalse();
    }
}
