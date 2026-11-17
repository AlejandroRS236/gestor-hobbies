package com.gestorhobbies.api.figuras;

import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.figuras.EstadoFigura;
import com.gestorhobbies.core.figuras.Figura;
import com.gestorhobbies.core.figuras.FiguraNoEncontradaException;
import com.gestorhobbies.core.figuras.FiguraService;
import com.gestorhobbies.core.tiendas.Tienda;
import com.gestorhobbies.core.tiendas.TiendaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FiguraController.class)
class FiguraControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private FiguraService servicio;

    @MockitoBean
    private TiendaService tiendas;

    @Test
    void listaLasFigurasDeUnEstadoConSuMejorPrecio() throws Exception {
        Figura figura = new Figura("Guerrera escala 1/7", EstadoFigura.PENSANDO_COMPRAR);
        figura.anadirEnlace(new Enlace(new Tienda("Figuya"), "https://figuya.com/x",
                new BigDecimal("149.90"), new BigDecimal("9.00")));
        when(servicio.listar(EstadoFigura.PENSANDO_COMPRAR)).thenReturn(List.of(figura));

        mvc.perform(get("/api/figuras").param("estado", "PENSANDO_COMPRAR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titulo").value("Guerrera escala 1/7"))
                .andExpect(jsonPath("$[0].estado").value("PENSANDO_COMPRAR"))
                .andExpect(jsonPath("$[0].enlaces[0].tienda").value("Figuya"))
                .andExpect(jsonPath("$[0].mejorTotal").value(158.90));
    }

    @Test
    void devuelve404SiLaFiguraNoExiste() throws Exception {
        when(servicio.obtener(99L)).thenThrow(new FiguraNoEncontradaException(99L));

        mvc.perform(get("/api/figuras/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void creaUnaFigura() throws Exception {
        when(servicio.guardar(any(Figura.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tiendas.obtener(7L)).thenReturn(new Tienda("Japan&Co"));

        mvc.perform(post("/api/figuras")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"titulo": "Maga figura PVC", "estado": "RESERVADA",
                                 "nota": 8.7, "enlaces": [{"tiendaId": 7,
                                 "url": "https://japanandco.example/maga", "precio": 89.00}]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Maga figura PVC"))
                .andExpect(jsonPath("$.nota").value(8.7))
                .andExpect(jsonPath("$.enlaces[0].tienda").value("Japan&Co"))
                .andExpect(jsonPath("$.enlaces[0].estado").value("NORMAL"))
                .andExpect(jsonPath("$.enlaces[0].total").value(89.00));
    }

    @Test
    void rechazaUnaFiguraSinTitulo() throws Exception {
        mvc.perform(post("/api/figuras")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\": \"\", \"estado\": \"ME_GUSTA\"}"))
                .andExpect(status().isBadRequest());
    }
}
