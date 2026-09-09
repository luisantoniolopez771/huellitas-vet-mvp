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

// Publica index.html, CSS y JavaScript desde el mismo servidor.
app.use(express.static(path.join(__dirname, "../frontend")));

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