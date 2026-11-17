package com.gestorhobbies.core.importacion;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ExtractorImagenesTest {

    @Test
    void sacaLasFotosDeLosDatosEstructuradosYDeLaGaleria() {
        String html = """
                <html><head>
                <meta property="og:image" content="https://cdn.tienda.example/coco-1.jpg">
                <script type="application/ld+json">
                {"@type":"Product","name":"Coco 1/6","image":["https:\\/\\/cdn.tienda.example\\/coco-1.jpg",
                 "https:\\/\\/cdn.tienda.example\\/coco-2.jpg?v=3"]}
                </script>
                </head><body>
                <img src="./Coco_files/coco-1.jpg">
                <img src="./Coco_files/x.jpg" data-zoom-image="https://cdn.tienda.example/coco-3-grande.webp">
                <img srcset="//cdn.tienda.example/coco-4_400.jpg 400w, //cdn.tienda.example/coco-4_1200.jpg 1200w">
                <a href="https://cdn.tienda.example/coco-5.png">Ampliar</a>
                <img src="https://cdn.tienda.example/logo-tienda.png">
                <a href="https://tienda.example/carrito">Carrito</a>
                </body></html>
                """;

        assertThat(ExtractorImagenes.extraer(html)).containsExactly(
                "https://cdn.tienda.example/coco-1.jpg",
                "https://cdn.tienda.example/coco-2.jpg?v=3",
                "https://cdn.tienda.example/coco-3-grande.webp",
                "https://cdn.tienda.example/coco-4_1200.jpg",
                "https://cdn.tienda.example/coco-5.png");
    }

    @Test
    void unaPaginaSinFotosDevuelveUnaListaVacia() {
        assertThat(ExtractorImagenes.extraer("<html><body><p>Hola</p></body></html>")).isEmpty();
    }
}
