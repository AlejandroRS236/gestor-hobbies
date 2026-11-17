package com.gestorhobbies.core.figuras;

import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.comun.EstadoEnlace;
import com.gestorhobbies.core.tiendas.Confianza;
import com.gestorhobbies.core.tiendas.Tienda;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FiguraTest {

    private static Enlace enlace(String tienda, String precio, String envio) {
        return new Enlace(new Tienda(tienda), "https://" + tienda + ".example/figura",
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
                .extracting(e -> e.getTienda().getNombre())
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
    void avisaCuandoLaFechaLimiteMasProximaEstaCerca() {
        LocalDate hoy = LocalDate.of(2026, 11, 17);
        Figura figura = new Figura("Guerrera escala 1/7", EstadoFigura.PENSANDO_COMPRAR);
        Enlace lejana = enlace("lejana", "100", null);
        lejana.setPedirAntesDe(hoy.plusDays(30));
        Enlace cercana = enlace("cercana", "110", null);
        cercana.setPedirAntesDe(hoy.plusDays(3));
        figura.anadirEnlace(lejana);
        figura.anadirEnlace(cercana);

        assertThat(figura.pedirAntesDe()).contains(hoy.plusDays(3));
        assertThat(figura.fechaLimiteCercana(hoy, 7)).isTrue();

        cercana.setEstado(EstadoEnlace.DESCARTADA);
        assertThat(figura.pedirAntesDe()).contains(hoy.plusDays(30));
        assertThat(figura.fechaLimiteCercana(hoy, 7)).isFalse();
    }

    @Test
    void elMejorPrecioIgnoraDescartadasYTiendasNoComprar() {
        Figura figura = new Figura("Kurisu Wedding Dress", EstadoFigura.PENSANDO_COMPRAR);
        Enlace normal = enlace("jedishop", "192.42", null);
        Enlace insolvente = enlace("waifuworld", "180.87", null);
        insolvente.getTienda().setConfianza(Confianza.NO_COMPRAR);
        Enlace descartada = enlace("otra", "150.00", null);
        descartada.setEstado(EstadoEnlace.DESCARTADA);
        figura.anadirEnlace(normal);
        figura.anadirEnlace(insolvente);
        figura.anadirEnlace(descartada);

        assertThat(figura.enlaceMasBarato()).contains(normal);
        assertThat(figura.tieneTiendaNoComprar()).isTrue();
    }

    @Test
    void elTituloNoPuedeEstarVacio() {
        assertThatThrownBy(() -> new Figura("  ", EstadoFigura.ME_GUSTA))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
