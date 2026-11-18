package com.gestorhobbies.core.figuras;

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

import java.time.Instant;
import java.util.Objects;

/** Una entrada del historial: la figura pasó de un estado a otro en una fecha. */
@Entity
@Table(name = "historial")
public class CambioEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elemento_id")
    private Figura figura;

    @Column(nullable = false)
    private Instant fecha;

    /** null cuando es el alta de la figura. */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 32)
    private EstadoFigura anterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 32)
    private EstadoFigura nuevo;

    protected CambioEstado() {
        // JPA
    }

    CambioEstado(Figura figura, EstadoFigura anterior, EstadoFigura nuevo, Instant fecha) {
        this.figura = Objects.requireNonNull(figura, "figura");
        this.anterior = anterior;
        this.nuevo = Objects.requireNonNull(nuevo, "nuevo");
        this.fecha = Objects.requireNonNull(fecha, "fecha");
    }

    public Long getId() {
        return id;
    }

    public Figura getFigura() {
        return figura;
    }

    public Instant getFecha() {
        return fecha;
    }

    public EstadoFigura getAnterior() {
        return anterior;
    }

    public EstadoFigura getNuevo() {
        return nuevo;
    }
}
