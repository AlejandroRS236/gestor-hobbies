package com.gestorhobbies.core.figuras;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Datos descriptivos de la figura, al estilo de MyFigureCollection. */
@Embeddable
public class FichaTecnica {

    private String categoria;

    /** Obra de origen (anime, juego...). */
    private String serie;

    private String personaje;

    private String version;

    /** "1/7", "1/6", "Non-scale"... */
    @Column(length = 20)
    private String escala;

    @Column(name = "altura_mm")
    private Integer alturaMm;

    @Column(name = "peso_g")
    private Integer pesoG;

    private String materiales;

    /** Avisos importantes, como que existen falsificaciones. */
    @Column(columnDefinition = "text")
    private String avisos;

    public FichaTecnica() {
    }

    public FichaTecnica(String categoria, String serie, String personaje, String version, String escala,
                        Integer alturaMm, Integer pesoG, String materiales, String avisos) {
        this.categoria = categoria;
        this.serie = serie;
        this.personaje = personaje;
        this.version = version;
        this.escala = escala;
        this.alturaMm = positivo(alturaMm);
        this.pesoG = positivo(pesoG);
        this.materiales = materiales;
        this.avisos = avisos;
    }

    private static Integer positivo(Integer valor) {
        if (valor != null && valor <= 0) {
            throw new IllegalArgumentException("Las medidas deben ser positivas");
        }
        return valor;
    }

    public String getCategoria() {
        return categoria;
    }

    public String getSerie() {
        return serie;
    }

    public String getPersonaje() {
        return personaje;
    }

    public String getVersion() {
        return version;
    }

    public String getEscala() {
        return escala;
    }

    public Integer getAlturaMm() {
        return alturaMm;
    }

    public Integer getPesoG() {
        return pesoG;
    }

    public String getMateriales() {
        return materiales;
    }

    public String getAvisos() {
        return avisos;
    }
}
