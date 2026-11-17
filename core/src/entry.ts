import { defaultConfig, run } from "./runner/run";

const app = document.getElementById("app")!;
const button = document.createElement("button");
const status = document.createElement("p");
const output = document.createElement("pre");
button.textContent = "Прогон";
app.append(button, status, output);

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Сценарий прогоняется";
  output.textContent = "";
  try {
    const protocol = await run(defaultConfig);
    output.textContent = JSON.stringify(protocol, null, 2);
  } catch (error) {
    status.textContent = `Ошибка: ${String(error)}`;
  } finally {
    button.disabled = false;
  }
});
