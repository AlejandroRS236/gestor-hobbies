package com.gestorhobbies.core.comun;

/** Situación de un elemento en una tienda concreta. */
public enum EstadoEnlace {
    NORMAL,
    /** Tengo una reserva hecha en esta tienda. */
    RESERVADA,
    /** No la voy a comprar aquí; no cuenta para el mejor precio ni para las fechas. */
    DESCARTADA
}
