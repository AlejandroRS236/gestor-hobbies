package com.gestorhobbies.core.perfil;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PerfilServiceTest {

    @Test
    void creaElPerfilSiNoExisteYGuardaLosCambiosSinEspacios() {
        PerfilRepository repositorio = mock(PerfilRepository.class);
        when(repositorio.findById(Perfil.ID)).thenReturn(Optional.empty());
        when(repositorio.save(any(Perfil.class))).thenAnswer(inv -> inv.getArgument(0));

        Perfil perfil = new PerfilService(repositorio).actualizar("  Alejandro ", "", "https://img/fondo.jpg");

        assertThat(perfil.getId()).isEqualTo(Perfil.ID);
        assertThat(perfil.getNombre()).isEqualTo("Alejandro");
        assertThat(perfil.getAvatarUrl()).isNull();
        assertThat(perfil.getFondoUrl()).isEqualTo("https://img/fondo.jpg");
    }
}
