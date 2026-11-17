package com.gestorhobbies.core.figuras;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Empresa o artista que ha participado en la figura, con su papel (fabricante, escultor...). */
@Embeddable
public class Participante {

    @Column(nullable = false)
    private String nombre;

    private String rol;

    protected Participante() {
        // JPA
    }

    public Participante(String nombre, String rol) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El participante necesita un nombre");
        }
        this.nombre = nombre.strip();
        this.rol = rol == null || rol.isBlank() ? null : rol.strip();
    }

    public String getNombre() {
        return nombre;
    }

    public String getRol() {
        return rol;
    }
}
