package com.gestorhobbies.api.figuras;

import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Objetos que entran y salen por la API, separados de las entidades. */
public final class FiguraDtos {

    private FiguraDtos() {
    }

    public record EnlaceRespuesta(Long id, String tienda, String url,
                                  BigDecimal precio, BigDecimal envio, BigDecimal total) {

        static EnlaceRespuesta desde(Enlace e) {
            return new EnlaceRespuesta(e.getId(), e.getTienda(), e.getUrl(),
                    e.getPrecio(), e.getEnvio(), e.total());
        }
    }

    public record FiguraRespuesta(Long id, String titulo, String imagenUrl, BigDecimal nota, String notas,
                                  EstadoFigura estado, String fabricante, String jan,
                                  LocalDate fechaSalida, LocalDate pedirAntesDe,
                                  String metodoPago, String riesgo,
                                  List<EnlaceRespuesta> enlaces, BigDecimal mejorTotal) {

        static FiguraRespuesta desde(Figura f) {
            return new FiguraRespuesta(f.getId(), f.getTitulo(), f.getImagenUrl(), f.getNota(), f.getNotas(),
                    f.getEstado(), f.getFabricante(), f.getJan(),
                    f.getFechaSalida(), f.getPedirAntesDe(), f.getMetodoPago(), f.getRiesgo(),
                    f.getEnlaces().stream().map(EnlaceRespuesta::desde).toList(),
                    f.enlaceMasBarato().map(Enlace::total).orElse(null));
        }
    }

    public record EnlacePeticion(@NotBlank String tienda,
                                 @NotBlank String url,
                                 @PositiveOrZero BigDecimal precio,
                                 @PositiveOrZero BigDecimal envio) {

        Enlace aEntidad() {
            return new Enlace(tienda, url, precio, envio);
        }
    }

    public record FiguraPeticion(@NotBlank String titulo,
                                 @NotNull EstadoFigura estado,
                                 String imagenUrl,
                                 @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal nota,
                                 String notas,
                                 String fabricante,
                                 String jan,
                                 LocalDate fechaSalida,
                                 LocalDate pedirAntesDe,
                                 String metodoPago,
                                 String riesgo,
                                 List<@Valid EnlacePeticion> enlaces) {

        Figura crear() {
            Figura figura = new Figura(titulo, estado);
            aplicarA(figura);
            return figura;
        }

        void aplicarA(Figura figura) {
            figura.setTitulo(titulo);
            figura.cambiarEstado(estado);
            figura.setImagenUrl(imagenUrl);
            figura.setNota(nota);
            figura.setNotas(notas);
            figura.setFabricante(fabricante);
            figura.setJan(jan);
            figura.setFechaSalida(fechaSalida);
            figura.setPedirAntesDe(pedirAntesDe);
            figura.setMetodoPago(metodoPago);
            figura.setRiesgo(riesgo);

            List.copyOf(figura.getEnlaces()).forEach(figura::quitarEnlace);
            if (enlaces != null) {
                enlaces.stream().map(EnlacePeticion::aEntidad).forEach(figura::anadirEnlace);
            }
        }
    }

    public record CambioEstado(@NotNull EstadoFigura estado) {
    }
}
