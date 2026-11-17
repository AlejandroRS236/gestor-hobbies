package com.gestorhobbies.core.figuras;

import com.gestorhobbies.core.comun.Elemento;
import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.tiendas.Confianza;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.Objects;
import java.util.Optional;

@Entity
@Table(name = "figura")
public class Figura extends Elemento {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EstadoFigura estado;

    private String fabricante;

    /** Código JAN (código de barras), útil para buscar la figura exacta. */
    @Column(length = 13)
    private String jan;

    private String riesgo;

    protected Figura() {
        // JPA
    }

    public Figura(String titulo, EstadoFigura estado) {
        super(titulo);
        cambiarEstado(estado);
    }

    public void cambiarEstado(EstadoFigura nuevo) {
        this.estado = Objects.requireNonNull(nuevo, "estado");
    }

    /** La fecha límite más próxima entre las tiendas que siguen siendo opción. */
    public Optional<LocalDate> pedirAntesDe() {
        return getEnlaces().stream()
                .filter(Enlace::esOpcionValida)
                .map(Enlace::getPedirAntesDe)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder());
    }

    /** Si quedan {@code dias} días o menos para la fecha límite más próxima. */
    public boolean fechaLimiteCercana(LocalDate hoy, int dias) {
        return pedirAntesDe()
                .filter(fecha -> !fecha.isBefore(hoy) && !fecha.isAfter(hoy.plusDays(dias)))
                .isPresent();
    }

    /** Si alguna de sus tiendas está marcada como "no comprar". */
    public boolean tieneTiendaNoComprar() {
        return getEnlaces().stream().anyMatch(e -> e.getTienda().getConfianza() == Confianza.NO_COMPRAR);
    }

    public EstadoFigura getEstado() {
        return estado;
    }

    public String getFabricante() {
        return fabricante;
    }

    public void setFabricante(String fabricante) {
        this.fabricante = fabricante;
    }

    public String getJan() {
        return jan;
    }

    public void setJan(String jan) {
        if (jan != null && !jan.isBlank() && !jan.strip().matches("\\d{8}|\\d{13}")) {
            throw new IllegalArgumentException("El código JAN debe tener 8 o 13 dígitos");
        }
        this.jan = jan == null || jan.isBlank() ? null : jan.strip();
    }

    public String getRiesgo() {
        return riesgo;
    }

    public void setRiesgo(String riesgo) {
        this.riesgo = riesgo;
    }
}
