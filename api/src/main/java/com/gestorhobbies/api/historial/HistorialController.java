package com.gestorhobbies.api.historial;

import com.gestorhobbies.core.figuras.CambioEstado;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.HistorialRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/historial")
public class HistorialController {

    public record Actualizacion(Long figuraId, String titulo, String imagenUrl,
                                EstadoFigura anterior, EstadoFigura nuevo, Instant fecha) {

        static Actualizacion desde(CambioEstado c) {
            return new Actualizacion(c.getFigura().getId(), c.getFigura().getTitulo(), c.getFigura().getImagenUrl(),
                    c.getAnterior(), c.getNuevo(), c.getFecha());
        }
    }

    private final HistorialRepository historial;

    public HistorialController(HistorialRepository historial) {
        this.historial = historial;
    }

    /** Los últimos cambios de estado, del más reciente al más antiguo. */
    @GetMapping
    @Transactional(readOnly = true)
    public List<Actualizacion> ultimos(@RequestParam(defaultValue = "10") int limite) {
        int tamano = Math.max(1, Math.min(limite, 100));
        return historial.ultimos(PageRequest.of(0, tamano)).stream().map(Actualizacion::desde).toList();
    }
}
