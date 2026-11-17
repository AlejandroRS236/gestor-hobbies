package com.gestorhobbies.core.figuras;

public class FiguraNoEncontradaException extends RuntimeException {

    public FiguraNoEncontradaException(Long id) {
        super("No existe ninguna figura con id " + id);
    }
}
