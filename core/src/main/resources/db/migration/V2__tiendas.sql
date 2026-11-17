-- Las tiendas pasan a ser fichas propias y cada enlace guarda sus plazos y notas.

CREATE TABLE tienda (
    id                 BIGSERIAL PRIMARY KEY,
    nombre             VARCHAR(255) NOT NULL UNIQUE,
    web                VARCHAR(2048),
    pais               VARCHAR(255),
    metodos_pago       TEXT,
    condiciones        TEXT,
    envio_por_defecto  NUMERIC(10, 2),
    confianza          VARCHAR(16) NOT NULL DEFAULT 'FIABLE',
    notas              TEXT
);

INSERT INTO tienda (nombre)
SELECT DISTINCT tienda FROM enlace;

ALTER TABLE enlace ADD COLUMN tienda_id BIGINT REFERENCES tienda (id);
UPDATE enlace e SET tienda_id = t.id FROM tienda t WHERE t.nombre = e.tienda;
ALTER TABLE enlace ALTER COLUMN tienda_id SET NOT NULL;
ALTER TABLE enlace DROP COLUMN tienda;
ALTER TABLE enlace ALTER COLUMN url DROP NOT NULL;

ALTER TABLE enlace
    ADD COLUMN salida          VARCHAR(100),
    ADD COLUMN pedir_antes_de  DATE,
    ADD COLUMN estado          VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN notas           TEXT,
    ADD COLUMN precio_visto    NUMERIC(10, 2),
    ADD COLUMN comprobado_el   DATE;

-- Lo que antes era de la figura pasa a cada una de sus tiendas.
UPDATE enlace e
SET pedir_antes_de = f.pedir_antes_de,
    salida = TO_CHAR(f.fecha_salida, 'MM/YYYY'),
    notas = CASE WHEN f.metodo_pago IS NULL THEN NULL ELSE 'Método de pago: ' || f.metodo_pago END
FROM figura f
WHERE f.id = e.elemento_id;

ALTER TABLE figura
    DROP COLUMN fecha_salida,
    DROP COLUMN pedir_antes_de,
    DROP COLUMN metodo_pago;

CREATE INDEX idx_enlace_tienda ON enlace (tienda_id);
