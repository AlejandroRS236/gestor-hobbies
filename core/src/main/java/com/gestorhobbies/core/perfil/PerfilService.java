package com.gestorhobbies.core.perfil;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerfilService {

    private final PerfilRepository repositorio;

    public PerfilService(PerfilRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Transactional
    public Perfil obtener() {
        return repositorio.findById(Perfil.ID).orElseGet(() -> repositorio.save(new Perfil()));
    }

    @Transactional
    public Perfil actualizar(String nombre, String avatarUrl, String fondoUrl) {
        Perfil perfil = obtener();
        perfil.actualizar(nombre, avatarUrl, fondoUrl);
        return perfil;
    }
}
