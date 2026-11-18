package com.gestorhobbies.core.perfil;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** El perfil del usuario: nombre, foto y fondo de los escaparates. La app es personal, así que hay uno. */
@Entity
@Table(name = "perfil")
public class Perfil {

    public static final long ID = 1L;

    @Id
    private Long id = ID;

    private String nombre;

    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;

    @Column(name = "fondo_url", length = 2048)
    private String fondoUrl;

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getFondoUrl() {
        return fondoUrl;
    }

    public void actualizar(String nombre, String avatarUrl, String fondoUrl) {
        this.nombre = vacioANull(nombre);
        this.avatarUrl = vacioANull(avatarUrl);
        this.fondoUrl = vacioANull(fondoUrl);
    }

    private static String vacioANull(String texto) {
        return texto == null || texto.isBlank() ? null : texto.strip();
    }
}
