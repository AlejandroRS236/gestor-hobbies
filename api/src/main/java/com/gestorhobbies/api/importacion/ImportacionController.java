package com.gestorhobbies.api.importacion;

import com.gestorhobbies.core.importacion.ImportadorExcel;
import com.gestorhobbies.core.importacion.ImportadorMfc;
import com.gestorhobbies.core.importacion.ResultadoImportacion;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/api/importar")
public class ImportacionController {

    private final ImportadorExcel importador;
    private final ImportadorMfc importadorMfc;

    public ImportacionController(ImportadorExcel importador, ImportadorMfc importadorMfc) {
        this.importador = importador;
        this.importadorMfc = importadorMfc;
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

    /** Una pestaña de la colección de MyFigureCollection guardada como HTML. */
    @PostMapping("/mfc")
    public ResultadoImportacion importarMfc(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        try (InputStream entrada = archivo.getInputStream()) {
            return importadorMfc.importar(entrada);
        }
    }
}
