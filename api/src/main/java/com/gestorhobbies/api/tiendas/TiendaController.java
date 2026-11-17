package com.gestorhobbies.api.tiendas;

import com.gestorhobbies.core.tiendas.Confianza;
import com.gestorhobbies.core.tiendas.Tienda;
import com.gestorhobbies.core.tiendas.TiendaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tiendas")
public class TiendaController {

    public record TiendaDto(Long id,
                            @NotBlank String nombre,
                            String web,
                            String pais,
                            String metodosPago,
                            String condiciones,
                            @PositiveOrZero BigDecimal envioPorDefecto,
                            Confianza confianza,
                            String notas) {

        static TiendaDto desde(Tienda t) {
            return new TiendaDto(t.getId(), t.getNombre(), t.getWeb(), t.getPais(), t.getMetodosPago(),
                    t.getCondiciones(), t.getEnvioPorDefecto(), t.getConfianza(), t.getNotas());
        }

        void aplicarA(Tienda t) {
            t.setNombre(nombre);
            t.setWeb(web);
            t.setPais(pais);
            t.setMetodosPago(metodosPago);
            t.setCondiciones(condiciones);
            t.setEnvioPorDefecto(envioPorDefecto);
            t.setConfianza(confianza == null ? Confianza.FIABLE : confianza);
            t.setNotas(notas);
        }
    }

    private final TiendaService servicio;

    public TiendaController(TiendaService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<TiendaDto> listar() {
        return servicio.listar().stream().map(TiendaDto::desde).toList();
    }

    @PostMapping
    public ResponseEntity<TiendaDto> crear(@Valid @RequestBody TiendaDto datos) {
        Tienda tienda = new Tienda(datos.nombre());
        datos.aplicarA(tienda);
        Tienda creada = servicio.guardar(tienda);
        return ResponseEntity.created(URI.create("/api/tiendas/" + creada.getId())).body(TiendaDto.desde(creada));
    }

    @PutMapping("/{id}")
    public TiendaDto actualizar(@PathVariable Long id, @Valid @RequestBody TiendaDto datos) {
        Tienda tienda = servicio.obtener(id);
        datos.aplicarA(tienda);
        return TiendaDto.desde(servicio.guardar(tienda));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
    }
}
