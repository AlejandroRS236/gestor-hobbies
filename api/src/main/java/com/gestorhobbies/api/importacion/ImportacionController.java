package com.gestorhobbies.api.importacion;

import com.gestorhobbies.core.importacion.ExtractorImagenes;
import com.gestorhobbies.core.importacion.ImportadorExcel;
import com.gestorhobbies.core.importacion.ImportadorMfc;
import com.gestorhobbies.core.importacion.ResultadoImportacion;
import com.gestorhobbies.core.figuras.EstadoFigura;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api/importar")
public class ImportacionController {

    private final ImportadorExcel importador;
    private final ImportadorMfc importadorMfc;
    private final ExtractorImagenes extractorImagenes;

    public ImportacionController(ImportadorExcel importador, ImportadorMfc importadorMfc,
                                 ExtractorImagenes extractorImagenes) {
        this.importador = importador;
        this.importadorMfc = importadorMfc;
        this.extractorImagenes = extractorImagenes;
    }

    /** Fotos de producto de la página de una tienda guardada como HTML. No guarda nada. */
    @PostMapping("/imagenes")
    public List<String> extraerImagenes(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        try (InputStream entrada = archivo.getInputStream()) {
            return extractorImagenes.extraer(entrada);
        }
    }

    @PostMapping("/excel")
    public ResultadoImportacion importarExcel(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        try (InputStream entrada = archivo.getInputStream()) {
            return importador.importar(entrada);
        }
    }

    /** Lee una pestaña de colección de MFC guardada como HTML y sugiere coincidencias, sin guardar nada. */
    @PostMapping("/mfc/previsualizar")
    public ImportadorMfc.Previsualizacion previsualizarMfc(@RequestParam("archivo") MultipartFile archivo)
            throws IOException {
        if (archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        try (InputStream entrada = archivo.getInputStream()) {
            return importadorMfc.previsualizar(entrada);
        }
    }

    public record PeticionMfc(@NotNull EstadoFigura estado, @NotNull List<ImportadorMfc.Decision> decisiones) {
    }

    /** Guarda lo que el usuario ha confirmado en la revisión. */
    @PostMapping("/mfc")
    public ResultadoImportacion importarMfc(@Valid @RequestBody PeticionMfc peticion) {
        return importadorMfc.aplicar(peticion.estado(), peticion.decisiones());
    }
}
