package com.gestorhobbies.core.comun;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * Un sitio donde comprar, ver o leer un elemento. En las figuras, cada
 * enlace es una "alternativa" en una tienda distinta.
 */
@Entity
@Table(name = "enlace")
public class Enlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elemento_id")
    private Elemento elemento;

    @Column(nullable = false)
    private String tienda;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(precision = 10, scale = 2)
    private BigDecimal envio;

    protected Enlace() {
        // JPA
    }

    public Enlace(String tienda, String url, BigDecimal precio, BigDecimal envio) {
        if (tienda == null || tienda.isBlank()) {
            throw new IllegalArgumentException("La tienda no puede estar vacía");
        }
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("La URL no puede estar vacía");
        }
        if (precio != null && precio.signum() < 0 || envio != null && envio.signum() < 0) {
            throw new IllegalArgumentException("El precio y el envío no pueden ser negativos");
        }
        this.tienda = tienda.strip();
        this.url = url.strip();
        this.precio = precio;
        this.envio = envio;
    }

    /** Precio + envío. Sin precio devuelve null; sin envío cuenta como 0. */
    public BigDecimal total() {
        if (precio == null) {
            return null;
        }
        return envio == null ? precio : precio.add(envio);
    }

    void asignarElemento(Elemento elemento) {
        this.elemento = elemento;
    }

    public Long getId() {
        return id;
    }

    public String getTienda() {
        return tienda;
    }

    public String getUrl() {
        return url;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public BigDecimal getEnvio() {
        return envio;
    }
}
