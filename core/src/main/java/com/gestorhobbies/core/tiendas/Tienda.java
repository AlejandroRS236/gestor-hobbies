package com.gestorhobbies.core.tiendas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Una tienda con la información que vale para todas sus figuras: condiciones,
 * métodos de pago, envío habitual y si es de fiar.
 */
@Entity
@Table(name = "tienda")
public class Tienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(length = 2048)
    private String web;

    private String pais;

    @Column(name = "metodos_pago", columnDefinition = "text")
    private String metodosPago;

    @Column(columnDefinition = "text")
    private String condiciones;

    @Column(name = "envio_por_defecto", precision = 10, scale = 2)
    private BigDecimal envioPorDefecto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Confianza confianza = Confianza.FIABLE;

    @Column(columnDefinition = "text")
    private String notas;

    protected Tienda() {
        // JPA
    }

    public Tienda(String nombre) {
        setNombre(nombre);
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("La tienda necesita un nombre");
        }
        this.nombre = nombre.strip();
    }

    public String getWeb() {
        return web;
    }

    public void setWeb(String web) {
        this.web = web;
    }

    public String getPais() {
        return pais;
    }

    public void setPais(String pais) {
        this.pais = pais;
    }

    public String getMetodosPago() {
        return metodosPago;
    }

    public void setMetodosPago(String metodosPago) {
        this.metodosPago = metodosPago;
    }

    public String getCondiciones() {
        return condiciones;
    }

    public void setCondiciones(String condiciones) {
        this.condiciones = condiciones;
    }

    public BigDecimal getEnvioPorDefecto() {
        return envioPorDefecto;
    }

    public void setEnvioPorDefecto(BigDecimal envioPorDefecto) {
        if (envioPorDefecto != null && envioPorDefecto.signum() < 0) {
            throw new IllegalArgumentException("El envío no puede ser negativo");
        }
        this.envioPorDefecto = envioPorDefecto;
    }

    public Confianza getConfianza() {
        return confianza;
    }

    public void setConfianza(Confianza confianza) {
        this.confianza = Objects.requireNonNull(confianza, "confianza");
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
