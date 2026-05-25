import { CardPool } from "./card-pool.js";
import { CollectionStore } from "./collection-store.js";
import { BoosterView } from "./booster-view.js";
import { CollectionView } from "./collection-view.js";

const boosterScreen    = document.getElementById("booster-screen");
const collectionScreen = document.getElementById("collection-screen");
const navBooster       = document.getElementById("nav-booster");
const navCollection    = document.getElementById("nav-collection");
const storageWarning   = document.getElementById("storage-warning");

export function switchScreen(id) {
  const isBooster = id === "booster";
  boosterScreen.classList.toggle("active", isBooster);
  boosterScreen.classList.toggle("hidden", !isBooster);
  collectionScreen.classList.toggle("active", !isBooster);
  collectionScreen.classList.toggle("hidden", isBooster);
  navBooster.classList.toggle("active", isBooster);
  navBooster.setAttribute("aria-pressed", String(isBooster));
  navCollection.classList.toggle("active", !isBooster);
  navCollection.setAttribute("aria-pressed", String(!isBooster));

  if (!isBooster) {
    collectionView.render();
  }
}

let collectionView;

async function init() {
  if (!CollectionStore.isAvailable()) {
    storageWarning.classList.remove("hidden");
  }

  try {
    await CardPool.init("./assets/index.json");
  } catch (err) {
    document.body.innerHTML = `
      <div style="padding:2rem;color:#ff6b6b;font-family:monospace">
        <strong>Erro ao carregar o catálogo de cartas.</strong><br>
        ${err.message}<br><br>
        Verifique se você rodou <code>python download_cards.py</code> e está
        servindo via HTTP (ex: <code>python -m http.server 8080</code>).
      </div>`;
    return;
  }

  const boosterView = new BoosterView(
    document.getElementById("card-slots"),
    document.getElementById("btn-open-booster"),
    () => collectionView.render(),
  );

  collectionView = new CollectionView(
    document.getElementById("progress-panel"),
    document.getElementById("filter-bar"),
    document.getElementById("collection-grid"),
  );

  navBooster.addEventListener("click", () => switchScreen("booster"));
  navCollection.addEventListener("click", () => switchScreen("collection"));
}

init();
