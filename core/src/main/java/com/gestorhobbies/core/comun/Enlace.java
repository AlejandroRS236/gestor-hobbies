package com.gestorhobbies.core.comun;

import com.gestorhobbies.core.tiendas.Confianza;
import com.gestorhobbies.core.tiendas.Tienda;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Un elemento en una tienda concreta: enlace, precio, envío, plazos y notas
 * propias. En las figuras, cada enlace es una "alternativa" en otra tienda.
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

    @ManyToOne(optional = false)
    @JoinColumn(name = "tienda_id")
    private Tienda tienda;

    @Column(length = 2048)
    private String url;

    @Column(precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(precision = 10, scale = 2)
    private BigDecimal envio;

    /** Texto libre: "Ene 2028", "En stock", "Disponible"... */
    @Column(length = 100)
    private String salida;

    @Column(name = "pedir_antes_de")
    private LocalDate pedirAntesDe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private EstadoEnlace estado = EstadoEnlace.NORMAL;

    @Column(columnDefinition = "text")
    private String notas;

    @Column(name = "precio_visto", precision = 10, scale = 2)
    private BigDecimal precioVisto;

    @Column(name = "comprobado_el")
    private LocalDate comprobadoEl;

    protected Enlace() {
        // JPA
    }

    public Enlace(Tienda tienda, String url, BigDecimal precio, BigDecimal envio) {
        this.tienda = Objects.requireNonNull(tienda, "tienda");
        setUrl(url);
        setPrecio(precio);
        setEnvio(envio);
    }

    /** Precio + envío. Sin precio devuelve null; sin envío cuenta como 0. */
    public BigDecimal total() {
        if (precio == null) {
            return null;
        }
        return envio == null ? precio : precio.add(envio);
    }

    /** Si este enlace cuenta para el mejor precio y las fechas límite. */
    public boolean esOpcionValida() {
        return estado != EstadoEnlace.DESCARTADA && tienda.getConfianza() != Confianza.NO_COMPRAR;
    }

    void asignarElemento(Elemento elemento) {
        this.elemento = elemento;
    }

    private static BigDecimal noNegativo(BigDecimal valor) {
        if (valor != null && valor.signum() < 0) {
            throw new IllegalArgumentException("El precio y el envío no pueden ser negativos");
        }
        return valor;
    }

    public Long getId() {
        return id;
    }

    public Tienda getTienda() {
        return tienda;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url == null || url.isBlank() ? null : url.strip();
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = noNegativo(precio);
    }

    public BigDecimal getEnvio() {
        return envio;
    }

    public void setEnvio(BigDecimal envio) {
        this.envio = noNegativo(envio);
    }

    public String getSalida() {
        return salida;
    }

    public void setSalida(String salida) {
        this.salida = salida;
    }

    public LocalDate getPedirAntesDe() {
        return pedirAntesDe;
    }

    public void setPedirAntesDe(LocalDate pedirAntesDe) {
        this.pedirAntesDe = pedirAntesDe;
    }

    public EstadoEnlace getEstado() {
        return estado;
    }

    public void setEstado(EstadoEnlace estado) {
        this.estado = Objects.requireNonNull(estado, "estado");
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public BigDecimal getPrecioVisto() {
        return precioVisto;
    }

    public void setPrecioVisto(BigDecimal precioVisto) {
        this.precioVisto = noNegativo(precioVisto);
    }

    public LocalDate getComprobadoEl() {
        return comprobadoEl;
    }

    public void setComprobadoEl(LocalDate comprobadoEl) {
        this.comprobadoEl = comprobadoEl;
    }
}
