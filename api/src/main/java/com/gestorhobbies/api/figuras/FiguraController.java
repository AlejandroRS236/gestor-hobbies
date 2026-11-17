package com.gestorhobbies.api.figuras;

import com.gestorhobbies.api.figuras.FiguraDtos.CambioEstado;
import com.gestorhobbies.api.figuras.FiguraDtos.FiguraPeticion;
import com.gestorhobbies.api.figuras.FiguraDtos.FiguraRespuesta;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/figuras")
public class FiguraController {

    private final FiguraService servicio;

    public FiguraController(FiguraService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<FiguraRespuesta> listar(@RequestParam(required = false) EstadoFigura estado) {
        return servicio.listar(estado).stream().map(FiguraRespuesta::desde).toList();
    }

    @GetMapping("/{id}")
    public FiguraRespuesta obtener(@PathVariable Long id) {
        return FiguraRespuesta.desde(servicio.obtener(id));
    }

    @PostMapping
    public ResponseEntity<FiguraRespuesta> crear(@Valid @RequestBody FiguraPeticion peticion) {
        Figura creada = servicio.guardar(peticion.crear());
        return ResponseEntity.created(URI.create("/api/figuras/" + creada.getId()))
                .body(FiguraRespuesta.desde(creada));
    }

    @PutMapping("/{id}")
    public FiguraRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody FiguraPeticion peticion) {
        Figura figura = servicio.obtener(id);
        peticion.aplicarA(figura);
        return FiguraRespuesta.desde(servicio.guardar(figura));
    }

    @PatchMapping("/{id}/estado")
    public FiguraRespuesta cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstado cambio) {
        return FiguraRespuesta.desde(servicio.cambiarEstado(id, cambio.estado()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
    }
}
