CREATE TABLE elemento (
    id              BIGSERIAL PRIMARY KEY,
    titulo          VARCHAR(255) NOT NULL,
    imagen_url      VARCHAR(2048),
    nota            NUMERIC(3, 1) CHECK (nota BETWEEN 0 AND 10),
    notas           TEXT,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE enlace (
    id           BIGSERIAL PRIMARY KEY,
    elemento_id  BIGINT NOT NULL REFERENCES elemento (id) ON DELETE CASCADE,
    tienda       VARCHAR(255) NOT NULL,
    url          VARCHAR(2048) NOT NULL,
    precio       NUMERIC(10, 2),
    envio        NUMERIC(10, 2)
);

CREATE INDEX idx_enlace_elemento ON enlace (elemento_id);

CREATE TABLE figura (
    id              BIGINT PRIMARY KEY REFERENCES elemento (id) ON DELETE CASCADE,
    estado          VARCHAR(32) NOT NULL,
    fabricante      VARCHAR(255),
    jan             VARCHAR(13),
    fecha_salida    DATE,
    pedir_antes_de  DATE,
    metodo_pago     VARCHAR(255),
    riesgo          VARCHAR(255)
);

CREATE INDEX idx_figura_estado ON figura (estado);
