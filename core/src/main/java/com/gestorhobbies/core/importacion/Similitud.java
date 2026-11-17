package com.gestorhobbies.core.importacion;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Parecido entre dos nombres de figura, de 0 a 1, contando palabras en común
 * (coeficiente de Dice). Sirve para sugerir que dos nombres distintos son la
 * misma figura; la decisión final la toma siempre el usuario.
 */
public final class Similitud {

    /** Palabras que no ayudan a distinguir figuras. */
    private static final Set<String> IGNORADAS = Set.of(
            "ver", "version", "re", "run", "rerun", "release", "the", "of", "no", "de", "la", "el",
            "figure", "figura", "size", "edition", "ed");

    private Similitud() {
    }

    public static double entre(String a, String b) {
        Set<String> pa = palabras(a);
        Set<String> pb = palabras(b);
        if (pa.isEmpty() || pb.isEmpty()) {
            return 0;
        }
        Set<String> comunes = new HashSet<>(pa);
        comunes.retainAll(pb);
        return 2.0 * comunes.size() / (pa.size() + pb.size());
    }

    static Set<String> palabras(String texto) {
        String limpio = Normalizer.normalize(texto.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return Arrays.stream(limpio.split("[^a-z0-9/]+"))
                .filter(p -> !p.isBlank() && !IGNORADAS.contains(p))
                .collect(Collectors.toSet());
    }
}
