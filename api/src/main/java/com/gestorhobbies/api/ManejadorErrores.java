package com.gestorhobbies.api;

import com.gestorhobbies.core.figuras.FiguraNoEncontradaException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Convierte las excepciones del dominio en respuestas HTTP claras. */
@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(FiguraNoEncontradaException.class)
    ProblemDetail noEncontrada(FiguraNoEncontradaException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail conflicto(IllegalStateException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail datosNoValidos(IllegalArgumentException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }
}
