package com.gestorhobbies.api.perfil;

import com.gestorhobbies.core.perfil.Perfil;
import com.gestorhobbies.core.perfil.PerfilService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/perfil")
public class PerfilController {

    public record PerfilDto(String nombre, String avatarUrl, String fondoUrl) {

        static PerfilDto desde(Perfil p) {
            return new PerfilDto(p.getNombre(), p.getAvatarUrl(), p.getFondoUrl());
        }
    }

    private final PerfilService servicio;

    public PerfilController(PerfilService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public PerfilDto obtener() {
        return PerfilDto.desde(servicio.obtener());
    }

    @PutMapping
    public PerfilDto actualizar(@RequestBody PerfilDto datos) {
        return PerfilDto.desde(servicio.actualizar(datos.nombre(), datos.avatarUrl(), datos.fondoUrl()));
    }
}
