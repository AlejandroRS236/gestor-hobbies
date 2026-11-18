-- Historial de cambios de estado (para "Últimas actualizaciones" y "Últimas conseguidas").
CREATE TABLE historial (
    id               BIGSERIAL PRIMARY KEY,
    elemento_id      BIGINT NOT NULL REFERENCES elemento (id) ON DELETE CASCADE,
    fecha            TIMESTAMP WITH TIME ZONE NOT NULL,
    estado_anterior  VARCHAR(32),
    estado_nuevo     VARCHAR(32) NOT NULL
);
CREATE INDEX idx_historial_fecha ON historial (fecha DESC);
CREATE INDEX idx_historial_elemento ON historial (elemento_id);

-- Las figuras que ya existían empiezan con su estado actual en la fecha de su última modificación.
INSERT INTO historial (elemento_id, fecha, estado_anterior, estado_nuevo)
SELECT f.id, e.actualizado_en, NULL, f.estado
FROM figura f JOIN elemento e ON e.id = f.id;

-- Perfil del usuario (uno solo: la app es personal).
CREATE TABLE perfil (
    id          BIGINT PRIMARY KEY,
    nombre      VARCHAR(255),
    avatar_url  VARCHAR(2048),
    fondo_url   VARCHAR(2048)
);
INSERT INTO perfil (id) VALUES (1);
