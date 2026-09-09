CREATE TABLE citas (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota VARCHAR2(100) NOT NULL,
    dueno VARCHAR2(100) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL
);

-- Registros de prueba (opcional para comprobar que retorne datos)
INSERT INTO citas (mascota, dueno, fecha_hora) 
VALUES ('Max', 'Juan Pérez', SYSTIMESTAMP);

COMMIT;