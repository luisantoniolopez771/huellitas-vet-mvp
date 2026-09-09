const statusElement = document.getElementById("status");
const checkButton = document.getElementById("check-button");

async function checkConnection() {
  checkButton.disabled = true;
  statusElement.textContent = "Comprobando conexión...";
  statusElement.dataset.state = "loading";

  try {
    const response = await fetch("/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();

    if (!response.ok || data.database !== "connected") {
      throw new Error(data.message || "La base de datos no está disponible");
    }

    statusElement.textContent = data.message;
    statusElement.dataset.state = "ok";
  } catch (error) {
    statusElement.textContent = `Conexión no disponible: ${error.message}`;
    statusElement.dataset.state = "error";
  } finally {
    checkButton.disabled = false;
  }
}

checkButton.addEventListener("click", checkConnection);
checkConnection();