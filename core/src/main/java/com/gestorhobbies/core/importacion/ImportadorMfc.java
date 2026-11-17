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
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Importa una pestaña de la colección de MyFigureCollection guardada desde el
 * navegador (Ctrl + S). La web no permite leerla de forma automática, así que
 * se trabaja sobre la copia que guarda el propio usuario.
 *
 * <p>Se hace en dos pasos: {@link #previsualizar} lee la página y sugiere qué
 * figuras ya existen con otro nombre; {@link #aplicar} guarda lo que el
 * usuario haya confirmado. La pestaña decide el estado de las figuras nuevas:
 * "Owned" → La tengo, "Ordered" → Reservada y "Wished" → Me gusta.</p>
 */
@Service
public class ImportadorMfc {

    /** Parecido mínimo para sugerir que una figura ya existe. */
    static final double UMBRAL_SUGERENCIA = 0.5;

    private static final String URL_ITEM = "https://myfigurecollection.net/item/";
    private static final Pattern ID_ITEM = Pattern.compile("/item/(\\d+)");
    private static final Pattern IMAGEN = Pattern.compile("(\\d+-[0-9a-f]+\\.(?:jpe?g|png|webp|gif))$");
    private static final Pattern FABRICANTE = Pattern.compile("\\s*\\(([^()]*)\\)\\s*$");
    private static final Pattern PREFIJO = Pattern.compile("^\\[[^\\]]*\\]\\s*-\\s*");
    private static final Pattern ESTADO_EN_URL = Pattern.compile("[?&]status=(\\d)");

    /** Una figura leída de MFC, con la figura existente que parece ser (si la hay). */
    public record Candidato(String mfcId, String titulo, String fabricante, String imagenUrl,
                            Long sugeridaId, String sugeridaTitulo, double parecido, boolean yaImportada) {
    }

    public record Previsualizacion(EstadoFigura estado, List<Candidato> candidatos) {
    }

    /** Qué hacer con cada figura: crearla, fusionarla con una existente u omitirla. */
    public record Decision(String mfcId, String titulo, String fabricante, String imagenUrl,
                           Accion accion, Long figuraId) {
    }

    public enum Accion { CREAR, FUSIONAR, OMITIR }

    private final FiguraRepository figuras;

    public ImportadorMfc(FiguraRepository figuras) {
        this.figuras = figuras;
    }

    @Transactional(readOnly = true)
    public Previsualizacion previsualizar(InputStream html) throws IOException {
        Document pagina = Jsoup.parse(html, StandardCharsets.UTF_8.name(), "https://myfigurecollection.net/");
        List<Candidato> leidos = leer(pagina);
        if (leidos.isEmpty()) {
            throw new IllegalArgumentException(
                    "No encuentro figuras en este archivo. ¿Es una página de colección de MyFigureCollection?");
        }
        return new Previsualizacion(estadoDePestana(pagina), emparejar(leidos, figuras.findAll()));
    }

    @Transactional
    public ResultadoImportacion aplicar(EstadoFigura estado, List<Decision> decisiones) {
        int creadas = 0;
        int fusionadas = 0;
        int omitidas = 0;
        List<String> avisos = new ArrayList<>();
        for (Decision d : decisiones) {
            switch (d.accion()) {
                case OMITIR -> omitidas++;
                case CREAR -> {
                    Figura figura = new Figura(d.titulo(), estado);
                    figura.setFabricante(d.fabricante());
                    figura.setImagenUrl(d.imagenUrl());
                    figura.setNotas("MyFigureCollection: " + URL_ITEM + d.mfcId());
                    figuras.save(figura);
                    creadas++;
                }
                case FUSIONAR -> {
                    Figura figura = d.figuraId() == null ? null : figuras.findById(d.figuraId()).orElse(null);
                    if (figura == null) {
                        avisos.add("No encuentro la figura con la que fusionar \"" + d.titulo() + "\"");
                        continue;
                    }
                    fusionar(figura, d);
                    fusionadas++;
                }
            }
        }
        if (fusionadas > 0) {
            avisos.add(0, fusionadas + " figuras ya existentes han recibido la foto y el enlace de MFC");
        }
        return new ResultadoImportacion(creadas, omitidas, 0, List.copyOf(avisos));
    }

    /** Completa una figura existente sin pisar nada de lo que ya tenía. */
    private static void fusionar(Figura figura, Decision d) {
        if (figura.getImagenUrl() == null) {
            figura.setImagenUrl(d.imagenUrl());
        }
        if (figura.getFabricante() == null) {
            figura.setFabricante(d.fabricante());
        }
        String enlace = URL_ITEM + d.mfcId();
        String notas = figura.getNotas();
        if (notas == null || !notas.contains(enlace)) {
            figura.setNotas((notas == null ? "" : notas + "\n") + "MyFigureCollection: " + enlace);
        }
    }

    private List<Candidato> leer(Document pagina) {
        List<Candidato> leidos = new ArrayList<>();
        Set<String> vistos = new LinkedHashSet<>();
        for (Element enlace : pagina.select(".item-icon a[href*='/item/']")) {
            Matcher id = ID_ITEM.matcher(enlace.attr("href"));
            Element imagen = enlace.selectFirst("img[alt]");
            if (!id.find() || imagen == null || !vistos.add(id.group(1))) {
                continue;
            }
            String nombreMfc = imagen.attr("alt").strip();
            Matcher fabricante = FABRICANTE.matcher(nombreMfc);
            String nombreFabricante = fabricante.find() ? fabricante.group(1).strip() : null;
            String titulo = PREFIJO.matcher(FABRICANTE.matcher(nombreMfc).replaceFirst("")).replaceFirst("").strip();
            if (!titulo.isEmpty()) {
                leidos.add(new Candidato(id.group(1), titulo, nombreFabricante, urlImagen(imagen.attr("src")),
                        null, null, 0, false));
            }
        }
        return leidos;
    }

    /**
     * Sugiere para cada figura de MFC la figura existente más parecida. Se
     * reparten de mejor a peor parecido para que dos figuras de MFC no se
     * queden con la misma figura existente.
     */
    static List<Candidato> emparejar(List<Candidato> leidos, List<Figura> existentes) {
        record Par(int candidato, Figura figura, double parecido) {
        }
        Map<Integer, Par> elegidos = new HashMap<>();
        Set<Long> figurasUsadas = new HashSet<>();
        Set<Integer> yaImportados = new HashSet<>();

        for (int i = 0; i < leidos.size(); i++) {
            String enlace = URL_ITEM + leidos.get(i).mfcId();
            for (Figura f : existentes) {
                boolean mismoEnlace = f.getNotas() != null && f.getNotas().contains(enlace);
                if (mismoEnlace || f.getTitulo().equalsIgnoreCase(leidos.get(i).titulo())) {
                    elegidos.put(i, new Par(i, f, 1.0));
                    figurasUsadas.add(f.getId());
                    yaImportados.add(i);
                    break;
                }
            }
        }

        List<Par> pares = new ArrayList<>();
        for (int i = 0; i < leidos.size(); i++) {
            if (elegidos.containsKey(i)) {
                continue;
            }
            for (Figura f : existentes) {
                double parecido = Similitud.entre(leidos.get(i).titulo(), f.getTitulo());
                if (parecido >= UMBRAL_SUGERENCIA) {
                    pares.add(new Par(i, f, parecido));
                }
            }
        }
        pares.sort(Comparator.comparingDouble(Par::parecido).reversed());
        for (Par par : pares) {
            if (!elegidos.containsKey(par.candidato()) && !figurasUsadas.contains(par.figura().getId())) {
                elegidos.put(par.candidato(), par);
                figurasUsadas.add(par.figura().getId());
            }
        }

        List<Candidato> resultado = new ArrayList<>();
        for (int i = 0; i < leidos.size(); i++) {
            Candidato c = leidos.get(i);
            Par par = elegidos.get(i);
            resultado.add(par == null ? c : new Candidato(c.mfcId(), c.titulo(), c.fabricante(), c.imagenUrl(),
                    par.figura().getId(), par.figura().getTitulo(), par.parecido(), yaImportados.contains(i)));
        }
        return resultado;
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
