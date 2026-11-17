package com.gestorhobbies;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del backend. Está en el paquete raíz para que Spring
 * encuentre tanto la API como las entidades y servicios del módulo core.
 */
@SpringBootApplication
public class GestorHobbiesApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestorHobbiesApplication.class, args);
    }
}
