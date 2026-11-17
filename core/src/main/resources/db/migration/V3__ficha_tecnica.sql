-- Ficha técnica de las figuras (pestaña "Información") y número de MyFigureCollection.

ALTER TABLE figura
    ADD COLUMN mfc_id      VARCHAR(20),
    ADD COLUMN categoria   VARCHAR(255),
    ADD COLUMN serie       VARCHAR(255),
    ADD COLUMN personaje   VARCHAR(255),
    ADD COLUMN version     VARCHAR(255),
    ADD COLUMN escala      VARCHAR(20),
    ADD COLUMN altura_mm   INTEGER CHECK (altura_mm > 0),
    ADD COLUMN peso_g      INTEGER CHECK (peso_g > 0),
    ADD COLUMN materiales  VARCHAR(255),
    ADD COLUMN avisos      TEXT;

-- Las figuras importadas antes guardaban el enlace a MFC en las notas.
UPDATE figura f
SET mfc_id = SUBSTRING(e.notas FROM 'myfigurecollection\.net/item/(\d+)')
FROM elemento e
WHERE e.id = f.id AND e.notas ~ 'myfigurecollection\.net/item/\d+';

CREATE INDEX idx_figura_mfc ON figura (mfc_id);

CREATE TABLE figura_participante (
    figura_id  BIGINT NOT NULL REFERENCES figura (id) ON DELETE CASCADE,
    orden      INTEGER NOT NULL,
    nombre     VARCHAR(255) NOT NULL,
    rol        VARCHAR(255),
    PRIMARY KEY (figura_id, orden)
);

CREATE TABLE figura_lanzamiento (
    figura_id  BIGINT NOT NULL REFERENCES figura (id) ON DELETE CASCADE,
    orden      INTEGER NOT NULL,
    fecha      VARCHAR(20),
    edicion    VARCHAR(255),
    precio     NUMERIC(12, 2),
    moneda     VARCHAR(3),
    jan        VARCHAR(13),
    PRIMARY KEY (figura_id, orden)
);
