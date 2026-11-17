package com.gestorhobbies.core.figuras;

import com.gestorhobbies.core.comun.Enlace;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FiguraTest {

    private static Enlace enlace(String tienda, String precio, String envio) {
        return new Enlace(tienda, "https://" + tienda + ".example/figura",
                precio == null ? null : new BigDecimal(precio),
                envio == null ? null : new BigDecimal(envio));
    }

    @Test
    void elTotalDeUnEnlaceSumaPrecioYEnvio() {
        assertThat(enlace("figuya", "149.90", "9.00").total()).isEqualByComparingTo("158.90");
        assertThat(enlace("figuya", "149.90", null).total()).isEqualByComparingTo("149.90");
        assertThat(enlace("figuya", null, "9.00").total()).isNull();
    }

    @Test
    void elEnlaceMasBaratoTieneEnCuentaElEnvio() {
        Figura figura = new Figura("Guerrera escala 1/7", EstadoFigura.PENSANDO_COMPRAR);
        figura.anadirEnlace(enlace("barata-sin-envio-gratis", "140.00", "25.00"));
        figura.anadirEnlace(enlace("algo-mas-cara", "150.00", "5.00"));
        figura.anadirEnlace(enlace("sin-precio", null, null));

        assertThat(figura.enlaceMasBarato())
                .get()
                .extracting(Enlace::getTienda)
                .isEqualTo("algo-mas-cara");
    }

    @Test
    void sinEnlacesConPrecioNoHayEnlaceMasBarato() {
        Figura figura = new Figura("Mecha articulado", EstadoFigura.ME_GUSTA);
        assertThat(figura.enlaceMasBarato()).isEmpty();
    }

    @Test
    void cambiarDeListaEsCambiarElEstado() {
        Figura figura = new Figura("Maga figura PVC", EstadoFigura.PENSANDO_COMPRAR);
        figura.cambiarEstado(EstadoFigura.RESERVADA);
        assertThat(figura.getEstado()).isEqualTo(EstadoFigura.RESERVADA);
    }

    @Test
    void laNotaAdmiteUnDecimalYSeLimitaA0y10() {
        Figura figura = new Figura("Maga figura PVC", EstadoFigura.LA_TENGO);
        figura.setNota(new BigDecimal("8.74"));
        assertThat(figura.getNota()).isEqualByComparingTo("8.7");

        assertThatThrownBy(() -> figura.setNota(new BigDecimal("10.5")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void elJanDebeTener8o13Digitos() {
        Figura figura = new Figura("Guerrera escala 1/7", EstadoFigura.ME_GUSTA);
        figura.setJan("4580416940000");
        assertThat(figura.getJan()).isEqualTo("4580416940000");

        assertThatThrownBy(() -> figura.setJan("12345"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void avisaCuandoLaFechaLimiteEstaCerca() {
        LocalDate hoy = LocalDate.of(2026, 11, 17);
        Figura figura = new Figura("Guerrera escala 1/7", EstadoFigura.PENSANDO_COMPRAR);

        figura.setPedirAntesDe(hoy.plusDays(3));
        assertThat(figura.fechaLimiteCercana(hoy, 7)).isTrue();

        figura.setPedirAntesDe(hoy.plusDays(30));
        assertThat(figura.fechaLimiteCercana(hoy, 7)).isFalse();

        figura.setPedirAntesDe(hoy.minusDays(1));
        assertThat(figura.fechaLimiteCercana(hoy, 7)).isFalse();
    }

    @Test
    void elTituloNoPuedeEstarVacio() {
        assertThatThrownBy(() -> new Figura("  ", EstadoFigura.ME_GUSTA))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
