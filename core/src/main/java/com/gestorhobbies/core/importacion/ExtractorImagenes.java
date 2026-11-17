package com.gestorhobbies.core.importacion;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Saca las fotos de producto de la página de una tienda guardada desde el
 * navegador. Al guardar, las etiquetas img pasan a apuntar a copias en disco,
 * así que se buscan las direcciones originales donde las tiendas suelen
 * dejarlas: datos estructurados (schema.org), metadatos para redes sociales,
 * atributos de zoom y enlaces a la imagen grande.
 */
@Service
public class ExtractorImagenes {

    static final int MAXIMO = 60;

    private static final Pattern URL_IMAGEN = Pattern.compile(
            "https?:\\\\?/\\\\?/[^\"'\\s<>()]+?\\.(?:jpe?g|png|webp|avif)(?:\\?[^\"'\\s<>()]*)?",
            Pattern.CASE_INSENSITIVE);
    private static final Set<String> DESCARTAR = Set.of(
            "logo", "icon", "sprite", "favicon", "placeholder", "payment", "flag", "banner", "avatar", "badge");
    private static final List<String> ATRIBUTOS = List.of(
            "data-zoom-image", "data-large_image", "data-zoom", "data-full", "data-src-large", "data-image",
            "data-src", "data-original", "src");

    public List<String> extraer(InputStream html) throws IOException {
        Document pagina = Jsoup.parse(html, StandardCharsets.UTF_8.name(), "");
        Set<String> encontradas = new LinkedHashSet<>();

        // 1. Datos estructurados: casi todas las tiendas listan ahí las fotos del producto.
        for (Element script : pagina.select("script[type=application/ld+json]")) {
            buscarEnTexto(script.data(), encontradas);
        }
        // 2. Metadatos para redes sociales.
        pagina.select("meta[property='og:image'], meta[property='og:image:secure_url'], meta[name='twitter:image']")
                .forEach(m -> anadir(m.attr("content"), encontradas));
        pagina.select("link[rel=image_src]").forEach(l -> anadir(l.attr("href"), encontradas));
        // 3. Galerías: atributos de zoom, srcset y enlaces a la imagen grande.
        for (Element img : pagina.select("img, [data-zoom-image], [data-large_image]")) {
            ATRIBUTOS.forEach(a -> anadir(img.attr(a), encontradas));
            String srcset = img.attr("srcset").isBlank() ? img.attr("data-srcset") : img.attr("srcset");
            if (!srcset.isBlank()) {
                String[] candidatos = srcset.split(",");
                anadir(candidatos[candidatos.length - 1].strip().split("\\s+")[0], encontradas);
            }
        }
        pagina.select("a[href]").forEach(a -> anadir(a.attr("href"), encontradas));

        return encontradas.stream().limit(MAXIMO).toList();
    }

    private static void buscarEnTexto(String texto, Set<String> destino) {
        Matcher m = URL_IMAGEN.matcher(texto);
        while (m.find()) {
            anadir(m.group().replace("\\/", "/"), destino);
        }
    }

    private static void anadir(String url, Set<String> destino) {
        if (url == null || url.isBlank()) {
            return;
        }
        String limpia = url.strip();
        if (limpia.startsWith("//")) {
            limpia = "https:" + limpia;
        }
        if (!URL_IMAGEN.matcher(limpia).matches()) {
            return;
        }
        String nombre = limpia.toLowerCase(Locale.ROOT).replaceFirst("\\?.*$", "");
        nombre = nombre.substring(nombre.lastIndexOf('/') + 1);
        for (String palabra : DESCARTAR) {
            if (nombre.contains(palabra)) {
                return;
            }
        }
        destino.add(limpia);
    }

    /** Atajo para las pruebas. */
    static List<String> extraer(String html) {
        try {
            return new ExtractorImagenes().extraer(new java.io.ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
