package com.gestorhobbies.core.figuras;

import com.gestorhobbies.core.comun.Elemento;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.Objects;

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

    @Column(name = "fecha_salida")
    private LocalDate fechaSalida;

    @Column(name = "pedir_antes_de")
    private LocalDate pedirAntesDe;

    @Column(name = "metodo_pago")
    private String metodoPago;

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

    /** Si quedan menos de {@code dias} días para la fecha límite de reserva. */
    public boolean fechaLimiteCercana(LocalDate hoy, int dias) {
        return pedirAntesDe != null
                && !pedirAntesDe.isBefore(hoy)
                && !pedirAntesDe.isAfter(hoy.plusDays(dias));
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

    public LocalDate getFechaSalida() {
        return fechaSalida;
    }

    public void setFechaSalida(LocalDate fechaSalida) {
        this.fechaSalida = fechaSalida;
    }

    public LocalDate getPedirAntesDe() {
        return pedirAntesDe;
    }

    public void setPedirAntesDe(LocalDate pedirAntesDe) {
        this.pedirAntesDe = pedirAntesDe;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getRiesgo() {
        return riesgo;
    }

    public void setRiesgo(String riesgo) {
        this.riesgo = riesgo;
    }
}
