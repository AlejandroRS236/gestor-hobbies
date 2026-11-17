package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.figuras.DatosFicha;
import com.gestorhobbies.core.figuras.DatosFicha.DatosLanzamiento;
import com.gestorhobbies.core.figuras.DatosFicha.DatosParticipante;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Lee la ficha de una figura de una página de MyFigureCollection guardada. */
final class LectorFichaMfc {

    /** Lo leído de la página: identificación de la figura y su ficha técnica. */
    record FichaMfc(String mfcId, String titulo, String fabricante, String imagenUrl, String jan, DatosFicha ficha) {
    }

    private static final Pattern ID_ITEM = Pattern.compile("/item/(\\d+)");
    private static final Pattern PRECIO = Pattern.compile("([\\d.,]+)\\s+([A-Z]{3})\\b");
    private static final Pattern JAN = Pattern.compile("\\b(\\d{13}|\\d{8})\\b");
    private static final Pattern ALTURA = Pattern.compile("H=\\s*(\\d+)\\s*mm");
    private static final Pattern FABRICANTE = Pattern.compile("\\s*\\(([^()]*)\\)\\s*$");
    private static final Pattern PREFIJO = Pattern.compile("^\\[[^\\]]*\\]\\s*-\\s*");

    private LectorFichaMfc() {
    }

    /** Si la página es la de una figura (y no una lista de colección). */
    static boolean esPaginaDeFigura(Document pagina) {
        return idDeFigura(pagina).isPresent() && !pagina.select(".data-field .data-label").isEmpty();
    }

    static FichaMfc leer(Document pagina) {
        String mfcId = idDeFigura(pagina)
                .orElseThrow(() -> new IllegalArgumentException("No es la página de una figura de MFC"));

        String categoria = null;
        String version = null;
        String materiales = null;
        String avisos = null;
        String escala = null;
        Integer altura = null;
        List<String> series = new ArrayList<>();
        List<String> personajes = new ArrayList<>();
        List<DatosParticipante> participantes = new ArrayList<>();
        List<DatosLanzamiento> lanzamientos = new ArrayList<>();

        String etiqueta = "";
        for (Element campo : pagina.select(".data-field")) {
            Element label = campo.selectFirst(".data-label");
            if (label != null) {
                etiqueta = label.ownText().strip();
            }
            Element valor = campo.selectFirst(".data-value");
            if (valor == null) {
                continue;
            }
            switch (etiqueta) {
                case "Category" -> categoria = vacioANull(valor.text());
                case "Origin" -> series.addAll(nombres(valor));
                case "Character" -> personajes.addAll(nombres(valor));
                case "Company", "Artists" -> {
                    for (Element entrada : valor.select(".item-entries")) {
                        Element nombre = entrada.selectFirst("a span");
                        Element rol = entrada.selectFirst("small em");
                        if (nombre != null && !nombre.text().isBlank()) {
                            participantes.add(new DatosParticipante(nombre.text(), rol == null ? null : rol.text()));
                        }
                    }
                }
                case "Version" -> version = vacioANull(valor.text());
                case "Releases" -> lanzamientos.add(lanzamiento(valor));
                case "Materials" -> materiales = vacioANull(String.join(", ", nombres(valor)));
                case "Dimensions" -> {
                    Element escalaEl = valor.selectFirst(".item-scale");
                    escala = escalaEl == null ? null : vacioANull(escalaEl.text().replace(" ", ""));
                    Matcher m = ALTURA.matcher(valor.text());
                    altura = m.find() ? Integer.valueOf(m.group(1)) : null;
                }
                case "Various" -> avisos = vacioANull(valor.text());
                default -> {
                    // El resto (estadísticas, listas...) no interesa.
                }
            }
        }

        String nombreCompleto = Optional.ofNullable(pagina.selectFirst("h1")).map(Element::text).orElse("").strip();
        String titulo = PREFIJO.matcher(FABRICANTE.matcher(nombreCompleto).replaceFirst("")).replaceFirst("").strip();
        String fabricante = participantes.stream()
                .filter(p -> "Manufacturer".equalsIgnoreCase(p.rol()))
                .map(DatosParticipante::nombre)
                .findFirst()
                .orElse(null);
        String jan = lanzamientos.stream().map(DatosLanzamiento::jan).filter(j -> j != null).findFirst().orElse(null);
        Element imagen = pagina.selectFirst("meta[property='og:image']");

        DatosFicha ficha = new DatosFicha(categoria, vacioANull(String.join(", ", series)),
                vacioANull(String.join(", ", personajes)), version, escala, altura, null, materiales, avisos,
                participantes, lanzamientos);
        return new FichaMfc(mfcId, titulo, fabricante, imagen == null ? null : imagen.attr("content"), jan, ficha);
    }

    private static Optional<String> idDeFigura(Document pagina) {
        Element canonica = pagina.selectFirst("link[rel=canonical]");
        if (canonica == null) {
            return Optional.empty();
        }
        Matcher m = ID_ITEM.matcher(canonica.attr("href"));
        return m.find() ? Optional.of(m.group(1)) : Optional.empty();
    }

    private static List<String> nombres(Element valor) {
        return valor.select(".item-entries a span").stream()
                .map(Element::text)
                .filter(t -> !t.isBlank())
                .collect(Collectors.toList());
    }

    private static DatosLanzamiento lanzamiento(Element valor) {
        Element fecha = valor.selectFirst(".time");
        Element edicion = valor.selectFirst("small.light");
        String texto = valor.text();
        BigDecimal precio = null;
        String moneda = null;
        Matcher m = PRECIO.matcher(texto);
        if (m.find()) {
            precio = new BigDecimal(m.group(1).replace(",", ""));
            moneda = m.group(2);
        }
        Element compra = valor.selectFirst("a[title^=Buy]");
        Matcher jan = JAN.matcher(compra == null ? "" : compra.text());
        return new DatosLanzamiento(
                fecha == null ? null : fecha.text(),
                edicion == null ? null : vacioANull(edicion.text().replaceFirst("^as\\s+", "")),
                precio, moneda, jan.find() ? jan.group(1) : null);
    }

    private static String vacioANull(String texto) {
        return texto == null || texto.isBlank() ? null : texto.strip();
    }
}
