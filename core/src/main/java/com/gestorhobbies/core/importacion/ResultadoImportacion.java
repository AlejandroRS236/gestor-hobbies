package com.gestorhobbies.core.importacion;

import java.util.List;

/** Resumen de una importación para enseñárselo al usuario. */
public record ResultadoImportacion(int figurasCreadas, int figurasOmitidas, int tiendasCreadas, List<String> avisos) {
}
