-- Lo que costó de verdad una figura que ya tengo (aproximado si no se recuerda exacto).
ALTER TABLE figura ADD COLUMN precio_pagado NUMERIC(10, 2) CHECK (precio_pagado >= 0);
