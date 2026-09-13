-- Cambiar el contexto a la Pluggable Database y al esquema del usuario de la app
ALTER SESSION SET CONTAINER = FREEPDB1;
ALTER SESSION SET CURRENT_SCHEMA = VET_APP;

-- Crear tabla citas si no existe en el esquema VET_APP
CREATE TABLE citas (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota VARCHAR2(100) NOT NULL,
    dueno VARCHAR2(100) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL
);

-- Insertar registro de prueba
INSERT INTO citas (mascota, dueno, fecha_hora)
VALUES ('Max', 'Juan Pérez', SYSTIMESTAMP);

COMMIT;