package com.gestorhobbies.core.figuras;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HistorialRepository extends JpaRepository<CambioEstado, Long> {

    /** Los cambios más recientes, con su figura ya cargada. */
    @Query("select c from CambioEstado c join fetch c.figura order by c.fecha desc, c.id desc")
    List<CambioEstado> ultimos(Pageable pagina);
}
