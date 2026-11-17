package com.gestorhobbies.core.figuras;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

/** Una salida a la venta: fecha, edición, precio oficial y código JAN. */
@Embeddable
public class Lanzamiento {

    /** Tal como lo da el fabricante: "09/2027", "12/15/2023"... */
    @Column(length = 20)
    private String fecha;

    private String edicion;

    @Column(precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(length = 3)
    private String moneda;

    @Column(length = 13)
    private String jan;

    protected Lanzamiento() {
        // JPA
    }

    public Lanzamiento(String fecha, String edicion, BigDecimal precio, String moneda, String jan) {
        this.fecha = fecha;
        this.edicion = edicion;
        this.precio = precio;
        this.moneda = moneda;
        this.jan = jan;
    }

    public String getFecha() {
        return fecha;
    }

    public String getEdicion() {
        return edicion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public String getMoneda() {
        return moneda;
    }

    public String getJan() {
        return jan;
    }
}
