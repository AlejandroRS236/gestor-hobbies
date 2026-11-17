package com.gestorhobbies.core.figuras;

import java.math.BigDecimal;
import java.util.List;

/**
 * La ficha técnica completa como valor inmutable: lo que viaja entre la API,
 * los importadores y la entidad {@link Figura}.
 */
public record DatosFicha(String categoria, String serie, String personaje, String version, String escala,
                         Integer alturaMm, Integer pesoG, String materiales, String avisos,
                         List<DatosParticipante> participantes, List<DatosLanzamiento> lanzamientos) {

    public record DatosParticipante(String nombre, String rol) {
    }

    public record DatosLanzamiento(String fecha, String edicion, BigDecimal precio, String moneda, String jan) {
    }

    public DatosFicha {
        participantes = participantes == null ? List.of() : List.copyOf(participantes);
        lanzamientos = lanzamientos == null ? List.of() : List.copyOf(lanzamientos);
    }
}
