package com.gestorhobbies.api.figuras;

import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.comun.EstadoEnlace;
import com.gestorhobbies.core.figuras.DatosFicha;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.tiendas.Confianza;
import com.gestorhobbies.core.tiendas.Tienda;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.function.LongFunction;

/** Objetos que entran y salen por la API, separados de las entidades. */
public final class FiguraDtos {

    private FiguraDtos() {
    }

    public record EnlaceRespuesta(Long id, Long tiendaId, String tienda, Confianza confianza, String url,
                                  BigDecimal precio, BigDecimal envio, BigDecimal total,
                                  String salida, LocalDate pedirAntesDe, EstadoEnlace estado, String notas,
                                  BigDecimal precioVisto, LocalDate comprobadoEl) {

        static EnlaceRespuesta desde(Enlace e) {
            Tienda t = e.getTienda();
            return new EnlaceRespuesta(e.getId(), t.getId(), t.getNombre(), t.getConfianza(), e.getUrl(),
                    e.getPrecio(), e.getEnvio(), e.total(),
                    e.getSalida(), e.getPedirAntesDe(), e.getEstado(), e.getNotas(),
                    e.getPrecioVisto(), e.getComprobadoEl());
        }
    }

    public record FiguraRespuesta(Long id, String titulo, String imagenUrl, List<String> imagenes,
                                  BigDecimal nota, String notas,
                                  EstadoFigura estado, String fabricante, String jan, String riesgo,
                                  List<EnlaceRespuesta> enlaces, Long mejorEnlaceId, BigDecimal mejorTotal,
                                  LocalDate pedirAntesDe, boolean avisoNoComprar, String mfcId, DatosFicha ficha) {

        static FiguraRespuesta desde(Figura f) {
            Enlace mejor = f.enlaceMasBarato().orElse(null);
            return new FiguraRespuesta(f.getId(), f.getTitulo(), f.getImagenUrl(), f.getImagenes(),
                    f.getNota(), f.getNotas(),
                    f.getEstado(), f.getFabricante(), f.getJan(), f.getRiesgo(),
                    f.getEnlaces().stream().map(EnlaceRespuesta::desde).toList(),
                    mejor == null ? null : mejor.getId(),
                    mejor == null ? null : mejor.total(),
                    f.pedirAntesDe().orElse(null),
                    f.tieneTiendaNoComprar(),
                    f.getMfcId(),
                    f.datosFicha());
        }
    }

    public record EnlacePeticion(@NotNull Long tiendaId,
                                 String url,
                                 @PositiveOrZero BigDecimal precio,
                                 @PositiveOrZero BigDecimal envio,
                                 String salida,
                                 LocalDate pedirAntesDe,
                                 EstadoEnlace estado,
                                 String notas,
                                 @PositiveOrZero BigDecimal precioVisto,
                                 LocalDate comprobadoEl) {

        Enlace aEntidad(LongFunction<Tienda> tiendas) {
            Enlace enlace = new Enlace(tiendas.apply(tiendaId), url, precio, envio);
            enlace.setSalida(salida);
            enlace.setPedirAntesDe(pedirAntesDe);
            enlace.setEstado(estado == null ? EstadoEnlace.NORMAL : estado);
            enlace.setNotas(notas);
            enlace.setPrecioVisto(precioVisto);
            enlace.setComprobadoEl(comprobadoEl);
            return enlace;
        }
    }

    public record FiguraPeticion(@NotBlank String titulo,
                                 @NotNull EstadoFigura estado,
                                 String imagenUrl,
                                 List<String> imagenes,
                                 @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal nota,
                                 String notas,
                                 String fabricante,
                                 String jan,
                                 String riesgo,
                                 List<@Valid EnlacePeticion> enlaces,
                                 String mfcId,
                                 DatosFicha ficha) {

        Figura crear(LongFunction<Tienda> tiendas) {
            Figura figura = new Figura(titulo, estado);
            aplicarA(figura, tiendas);
            return figura;
        }

        void aplicarA(Figura figura, LongFunction<Tienda> tiendas) {
            figura.setTitulo(titulo);
            figura.cambiarEstado(estado);
            figura.setImagenUrl(imagenUrl);
            figura.setImagenes(imagenes);
            figura.setNota(nota);
            figura.setNotas(notas);
            figura.setFabricante(fabricante);
            figura.setJan(jan);
            figura.setRiesgo(riesgo);
            figura.setMfcId(mfcId);
            if (ficha != null) {
                figura.aplicarFicha(ficha);
            }

            List.copyOf(figura.getEnlaces()).forEach(figura::quitarEnlace);
            if (enlaces != null) {
                enlaces.stream().map(e -> e.aEntidad(tiendas)).forEach(figura::anadirEnlace);
            }
        }
    }

    public record CambioEstado(@NotNull EstadoFigura estado) {
    }
}
