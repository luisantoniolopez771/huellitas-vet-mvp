const express = require("express");
const oracledb = require("oracledb");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT || 3000);

let pool;
let server;
let shuttingDown = false;

app.disable("x-powered-by");
app.use(express.json());

app.get("/health", async (req, res) => {
  let connection;

  res.set("Cache-Control", "no-store");

  try {
    connection = await pool.getConnection();
    connection.callTimeout = 5000;

    // Verifica la conexión sin ejecutar SQL.
    await connection.ping();

    res.status(200).json({
      status: "ok",
      database: "connected",
      message: "Conexión con Oracle exitosa"
    });
  } catch (error) {
    console.error("Error de conexión con Oracle:", error.message);

    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: "No se pudo conectar con Oracle"
    });
  } finally {
    if (connection) {
      try {
        // Devuelve la conexión al pool.
        await connection.close();
      } catch (error) {
        console.error("Error al liberar la conexión:", error.message);
      }
    }
  }
});

app.post('/api/citas', async (req, res) => {
  const { dueno, mascota, fechaHora } = req.body;
  let connection;
  
  try {
    // Obtener conexión a Oracle
    connection = await pool.getConnection(); 
    
    // 1. VALIDACIÓN: Buscar si ya hay una cita a esa misma hora
    const checkQuery = `
      SELECT COUNT(*) AS total 
      FROM Citas 
      WHERE fecha_hora = TO_DATE(:fechaHora, 'YYYY-MM-DD"T"HH24:MI')
    `;
    const checkResult = await connection.execute(
      checkQuery, 
      [fechaHora], 
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (checkResult.rows[0].TOTAL > 0) {
      // Si la cuenta es mayor a 0, ya está ocupado. Rechazar la petición.
      return res.status(400).json({ error: 'El horario está ocupado. Por favor, elige otra fecha y hora.' });
    }
    
    // 2. INSERCIÓN: Si está libre, guardar en la base de datos (con las columnas corregidas)
    const insertQuery = `
      INSERT INTO Citas (dueno, mascota, fecha_hora) 
      VALUES (:dueno, :mascota, TO_DATE(:fechaHora, 'YYYY-MM-DD"T"HH24:MI'))
    `;
    await connection.execute(insertQuery, [dueno, mascota, fechaHora], { autoCommit: true });
    
    // Responder con éxito
    res.status(200).json({ mensaje: 'Cita guardada con éxito.' });
    
  } catch (error) {
    console.error("Error en /api/citas:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
});

// Publica index.html, CSS y JavaScript desde el mismo servidor.
app.use(express.static(path.join(__dirname, "../frontend")));

// RUTA DE CITAS (VH-2)
app.get("/api/citas", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(
      `SELECT * FROM CITAS`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({
      error: "Error al consultar las citas",
      mensaje_oracle: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar conexión:", err);
      }
    }
  }
});

async function start() {
  for (const variable of [
    "DB_USER",
    "DB_PASSWORD",
    "DB_CONNECT_STRING"
  ]) {
    if (!process.env[variable]) {
      throw new Error(`Falta la variable de entorno ${variable}`);
    }
  }

  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 0,
    poolMax: 5,
    poolIncrement: 1,
    queueTimeout: 5000,
    connectTimeout: 5
  });

  server = app.listen(port, "0.0.0.0", () => {
    console.log(`Servidor disponible en el puerto ${port}`);
  });
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  // Evita que una conexión pendiente bloquee el apagado.
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }

    if (pool) {
      await pool.close(0);
    }

    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    console.error("Error al apagar el servidor:", error.message);
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});


// 1. Endpoint para Cancelar
app.post('/api/citas/:id/cancelar', (req, res) => {
    const id = req.params.id;
    const query = "UPDATE citas SET estatus = 'Cancelada' WHERE id = ?";
    
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Error en la base de datos" });
        res.json({ mensaje: "Cita cancelada correctamente" });
    });
});

// 2. Endpoint para Reprogramar (Incluye validación VH-3)
app.post('/api/citas/:id/reprogramar', (req, res) => {
    const id = req.params.id;
    const { nueva_fecha_hora } = req.body;

    // Verificar empalme (Regla VH-3)
    const checkQuery = "SELECT id FROM citas WHERE fecha_hora = ? AND estatus = 'Activa'";
    
    db.query(checkQuery, [nueva_fecha_hora], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al validar horario" });
        
        // Si hay resultados, el horario está ocupado
        if (results.length > 0) {
            return res.status(409).json({ error: "Empalme de horario: La fecha y hora ya están ocupadas." });
        }

        // Si está libre, actualizamos
        const updateQuery = "UPDATE citas SET fecha_hora = ? WHERE id = ?";
        db.query(updateQuery, [nueva_fecha_hora, id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al actualizar" });
            res.json({ mensaje: "Cita reprogramada con éxito" });
        });
    });
});