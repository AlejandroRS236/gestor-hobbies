package com.gestorhobbies.core.tiendas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TiendaRepository extends JpaRepository<Tienda, Long> {

    List<Tienda> findAllByOrderByNombreAsc();

    Optional<Tienda> findByNombreIgnoreCase(String nombre);

    @Query("select count(e) from Enlace e where e.tienda = :tienda")
    long contarUsos(Tienda tienda);
}
