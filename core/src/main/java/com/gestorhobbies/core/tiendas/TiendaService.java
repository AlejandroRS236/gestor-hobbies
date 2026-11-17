package com.gestorhobbies.core.tiendas;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TiendaService {

    private final TiendaRepository repositorio;

    public TiendaService(TiendaRepository repositorio) {
        this.repositorio = repositorio;
    }

    public List<Tienda> listar() {
        return repositorio.findAllByOrderByNombreAsc();
    }

    public Tienda obtener(Long id) {
        return repositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe ninguna tienda con id " + id));
    }

    @Transactional
    public Tienda guardar(Tienda tienda) {
        repositorio.findByNombreIgnoreCase(tienda.getNombre())
                .filter(otra -> !otra.getId().equals(tienda.getId()))
                .ifPresent(otra -> {
                    throw new IllegalArgumentException("Ya existe una tienda llamada " + otra.getNombre());
                });
        return repositorio.save(tienda);
    }

    /** Busca la tienda por nombre (sin distinguir mayúsculas) o la crea si no existe. */
    @Transactional
    public Tienda obtenerOCrear(String nombre) {
        return repositorio.findByNombreIgnoreCase(nombre.strip())
                .orElseGet(() -> repositorio.save(new Tienda(nombre)));
    }

    @Transactional
    public void eliminar(Long id) {
        Tienda tienda = obtener(id);
        long usos = repositorio.contarUsos(tienda);
        if (usos > 0) {
            throw new IllegalStateException("No se puede eliminar " + tienda.getNombre()
                    + ": la usan " + usos + " figura(s). Quítala de esas figuras primero.");
        }
        repositorio.delete(tienda);
    }
}
