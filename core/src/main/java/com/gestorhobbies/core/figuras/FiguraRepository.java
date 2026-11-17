package com.gestorhobbies.core.figuras;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FiguraRepository extends JpaRepository<Figura, Long> {

    List<Figura> findByEstadoOrderByTituloAsc(EstadoFigura estado);

    List<Figura> findAllByOrderByTituloAsc();

    boolean existsByTituloIgnoreCase(String titulo);
}
