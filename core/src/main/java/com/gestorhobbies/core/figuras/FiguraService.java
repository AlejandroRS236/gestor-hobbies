package com.gestorhobbies.core.figuras;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FiguraService {

    private final FiguraRepository repositorio;

    public FiguraService(FiguraRepository repositorio) {
        this.repositorio = repositorio;
    }

    /** Todas las figuras, o solo las de un estado si se indica. */
    public List<Figura> listar(EstadoFigura estado) {
        return estado == null
                ? repositorio.findAllByOrderByTituloAsc()
                : repositorio.findByEstadoOrderByTituloAsc(estado);
    }

    public Figura obtener(Long id) {
        return repositorio.findById(id).orElseThrow(() -> new FiguraNoEncontradaException(id));
    }

    @Transactional
    public Figura guardar(Figura figura) {
        return repositorio.save(figura);
    }

    @Transactional
    public Figura cambiarEstado(Long id, EstadoFigura nuevo) {
        Figura figura = obtener(id);
        figura.cambiarEstado(nuevo);
        return figura;
    }

    @Transactional
    public void eliminar(Long id) {
        repositorio.delete(obtener(id));
    }
}
