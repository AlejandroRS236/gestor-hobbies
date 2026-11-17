package com.gestorhobbies.core.comun;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Base común de todos los hobbies: título, imagen, nota con decimales,
 * notas personales y enlaces (dónde comprar, ver o leer).
 */
@Entity
@Table(name = "elemento")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Elemento {

    private static final BigDecimal NOTA_MAXIMA = BigDecimal.TEN;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(name = "imagen_url", length = 2048)
    private String imagenUrl;

    /** Galería: todas las fotos del elemento (la principal es {@link #imagenUrl}). */
    @ElementCollection
    @CollectionTable(name = "elemento_imagen", joinColumns = @JoinColumn(name = "elemento_id"))
    @OrderColumn(name = "orden")
    @Column(name = "url", length = 2048, nullable = false)
    private List<String> imagenes = new ArrayList<>();

    @Column(precision = 3, scale = 1)
    private BigDecimal nota;

    @Column(columnDefinition = "text")
    private String notas;

    @OneToMany(mappedBy = "elemento", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<Enlace> enlaces = new ArrayList<>();

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    protected Elemento() {
        // JPA
    }

    protected Elemento(String titulo) {
        setTitulo(titulo);
    }

    @PrePersist
    void alCrear() {
        creadoEn = Instant.now();
        actualizadoEn = creadoEn;
    }

    @PreUpdate
    void alActualizar() {
        actualizadoEn = Instant.now();
    }

    public void anadirEnlace(Enlace enlace) {
        Objects.requireNonNull(enlace, "enlace");
        enlace.asignarElemento(this);
        enlaces.add(enlace);
    }

    public void quitarEnlace(Enlace enlace) {
        if (enlaces.remove(enlace)) {
            enlace.asignarElemento(null);
        }
    }

    /**
     * El enlace con menor precio total (precio + envío) entre los que tienen precio,
     * sin contar los descartados ni las tiendas marcadas como "no comprar".
     */
    public Optional<Enlace> enlaceMasBarato() {
        return enlaces.stream()
                .filter(Enlace::esOpcionValida)
                .filter(e -> e.getPrecio() != null)
                .min(Comparator.comparing(Enlace::total));
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        if (titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("El título no puede estar vacío");
        }
        this.titulo = titulo.strip();
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public List<String> getImagenes() {
        return Collections.unmodifiableList(imagenes);
    }

    /** Sustituye la galería, quitando vacíos y repetidos y conservando el orden. */
    public void setImagenes(List<String> nuevas) {
        imagenes.clear();
        if (nuevas != null) {
            nuevas.stream()
                    .filter(Objects::nonNull)
                    .map(String::strip)
                    .filter(url -> !url.isEmpty())
                    .distinct()
                    .forEach(imagenes::add);
        }
    }

    /** Añade a la galería las imágenes que todavía no tenga. */
    public void anadirImagenes(List<String> nuevas) {
        List<String> todas = new ArrayList<>(imagenes);
        todas.addAll(nuevas);
        setImagenes(todas);
    }

    public BigDecimal getNota() {
        return nota;
    }

    /** Nota de 0 a 10 con un decimal, por ejemplo 8,7. */
    public void setNota(BigDecimal nota) {
        if (nota != null && (nota.signum() < 0 || nota.compareTo(NOTA_MAXIMA) > 0)) {
            throw new IllegalArgumentException("La nota debe estar entre 0 y 10");
        }
        this.nota = nota == null ? null : nota.setScale(1, RoundingMode.HALF_UP);
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public List<Enlace> getEnlaces() {
        return Collections.unmodifiableList(enlaces);
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public Instant getActualizadoEn() {
        return actualizadoEn;
    }
}
