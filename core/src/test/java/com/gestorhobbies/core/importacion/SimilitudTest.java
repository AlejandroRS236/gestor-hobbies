package com.gestorhobbies.core.importacion;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SimilitudTest {

    @Test
    void nombresDeLaMismaFiguraSeParecenMucho() {
        assertThat(Similitud.entre("Lucy (Cyberpunk: Edgerunners) 1/7", "Cyberpunk: Edgerunners - Lucy - 1/7"))
                .isEqualTo(1.0);
        assertThat(Similitud.entre("Kurisu Makise – Racing 1/7", "Steins;Gate - Makise Kurisu - 1/7 - Racing Ver."))
                .isGreaterThan(0.75);
    }

    @Test
    void variantesDistintasSeParecenMenosQueLaCorrecta() {
        String excel = "Kurisu Makise – Lab Coat Bunny Ver. 1/7";
        double correcta = Similitud.entre(excel, "Steins;Gate - Makise Kurisu - 1/7 - Lab Coat Bunny Ver.");
        double otra = Similitud.entre(excel, "Steins;Gate - Makise Kurisu - Nendoroid Doll - Lab Coat Ver.");
        assertThat(correcta).isGreaterThan(otra);
    }

    @Test
    void ignoraMayusculasTildesYPalabrasDeRelleno() {
        assertThat(Similitud.entre("Maomao Re-run Ver.", "MAOMAO")).isEqualTo(1.0);
        assertThat(Similitud.entre("", "Maomao")).isZero();
    }
}
