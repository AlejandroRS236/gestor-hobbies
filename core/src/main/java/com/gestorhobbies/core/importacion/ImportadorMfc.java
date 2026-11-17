package com.gestorhobbies.core.importacion;

import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Importa una pestaña de la colección de MyFigureCollection guardada desde el
 * navegador (Ctrl + S). La web no permite leerla de forma automática, así que
 * se trabaja sobre la copia que guarda el propio usuario.
 *
 * <p>La pestaña decide el estado: "Owned" → La tengo, "Ordered" → Reservada y
 * "Wished" → Me gusta.</p>
 */
@Service
public class ImportadorMfc {

    private static final Pattern ID_ITEM = Pattern.compile("/item/(\\d+)");
    private static final Pattern IMAGEN = Pattern.compile("(\\d+-[0-9a-f]+\\.(?:jpe?g|png|webp|gif))$");
    private static final Pattern FABRICANTE = Pattern.compile("\\s*\\(([^()]*)\\)\\s*$");
    private static final Pattern PREFIJO = Pattern.compile("^\\[[^\\]]*\\]\\s*-\\s*");
    private static final Pattern ESTADO_EN_URL = Pattern.compile("[?&]status=(\\d)");

    private final FiguraRepository figuras;

    public ImportadorMfc(FiguraRepository figuras) {
        this.figuras = figuras;
    }

    @Transactional
    public ResultadoImportacion importar(InputStream html) throws IOException {
        Document pagina = Jsoup.parse(html, StandardCharsets.UTF_8.name(), "https://myfigurecollection.net/");
        EstadoFigura estado = estadoDePestana(pagina);
        List<String> avisos = new ArrayList<>();
        Set<String> vistos = new LinkedHashSet<>();
        int creadas = 0;
        int omitidas = 0;

        for (Element enlace : pagina.select(".item-icon a[href*='/item/']")) {
            Matcher id = ID_ITEM.matcher(enlace.attr("href"));
            Element imagen = enlace.selectFirst("img[alt]");
            if (!id.find() || imagen == null || !vistos.add(id.group(1))) {
                continue;
            }
            String nombreMfc = imagen.attr("alt").strip();
            Matcher fabricante = FABRICANTE.matcher(nombreMfc);
            String titulo = PREFIJO.matcher(fabricante.replaceFirst("")).replaceFirst("").strip();
            if (titulo.isEmpty()) {
                avisos.add("Figura #" + id.group(1) + " sin nombre, se ignora");
                continue;
            }
            if (figuras.existsByTituloIgnoreCase(titulo)) {
                omitidas++;
                continue;
            }

            Figura figura = new Figura(titulo, estado);
            fabricante.reset();
            if (fabricante.find()) {
                figura.setFabricante(fabricante.group(1).strip());
            }
            figura.setImagenUrl(urlImagen(imagen.attr("src")));
            figura.setNotas("MyFigureCollection: https://myfigurecollection.net/item/" + id.group(1));
            figuras.save(figura);
            creadas++;
        }

        if (vistos.isEmpty()) {
            throw new IllegalArgumentException(
                    "No encuentro figuras en este archivo. ¿Es una página de colección de MyFigureCollection?");
        }
        return new ResultadoImportacion(creadas, omitidas, 0, List.copyOf(avisos));
    }

    private static EstadoFigura estadoDePestana(Document pagina) {
        Element pestana = pagina.selectFirst(".result-tabs a.selected");
        if (pestana != null) {
            Matcher m = ESTADO_EN_URL.matcher(pestana.attr("href"));
            if (m.find()) {
                return switch (m.group(1)) {
                    case "2" -> EstadoFigura.LA_TENGO;
                    case "1" -> EstadoFigura.RESERVADA;
                    default -> EstadoFigura.ME_GUSTA;
                };
            }
        }
        return EstadoFigura.ME_GUSTA;
    }

    /** Las imágenes guardadas apuntan a disco; se rehace la dirección original en tamaño grande. */
    private static String urlImagen(String src) {
        Matcher m = IMAGEN.matcher(src);
        return m.find() ? "https://static.myfigurecollection.net/upload/items/2/" + m.group(1) : null;
    }
}
