-- Galería de imágenes de cada elemento (varios ángulos, fotos oficiales...).
CREATE TABLE elemento_imagen (
    elemento_id  BIGINT NOT NULL REFERENCES elemento (id) ON DELETE CASCADE,
    orden        INTEGER NOT NULL,
    url          VARCHAR(2048) NOT NULL,
    PRIMARY KEY (elemento_id, orden)
);
