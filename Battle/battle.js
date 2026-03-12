let battleState = {
  pokemon1: null,
  pokemon2: null,
  pokemon1HP: 0,
  pokemon2HP: 0,
  currentTurn: 0,
  maxTurns: 10,
  battleActive: false,
  battleLog: [],
};

document.addEventListener("DOMContentLoaded", () => {
  loadHeaderNav();
  verifyAuth();

  const startBattleBtn = document.getElementById("startBattleBtn");
  const newBattleBtn = document.getElementById("newBattleBtn");

  startBattleBtn.addEventListener("click", initiateBattle);
  newBattleBtn.addEventListener("click", () => {
    location.reload();
  });
});

async function getRandomPokemon() {
  try {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${randomId}`,
    );
    if (!response.ok) throw new Error("Pokemon fetch failed");
    const data = await response.json();

    return {
      name: data.name,
      image:
        data.sprites.other["official-artwork"].front_default ||
        data.sprites.front_default,
      hp: data.stats[0].base_stat,
      attack: data.stats[1].base_stat,
      defense: data.stats[2].base_stat,
      speedStat: data.stats[5].base_stat,
    };
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    return null;
  }
}

async function initiateBattle() {
  const setupSection = document.getElementById("setupSection");
  const battleSection = document.getElementById("battleSection");
  const startBattleBtn = document.getElementById("startBattleBtn");

  startBattleBtn.disabled = true;
  startBattleBtn.textContent = "Loading...";

  console.log("Fetching Pokemon...");
  const [poke1, poke2] = await Promise.all([
    getRandomPokemon(),
    getRandomPokemon(),
  ]);

  if (!poke1 || !poke2) {
    alert("Failed to load Pokemon. Please try again.");
    startBattleBtn.disabled = false;
    startBattleBtn.textContent = "Start Battle";
    return;
  }

  battleState.pokemon1 = poke1;
  battleState.pokemon2 = poke2;
  battleState.pokemon1HP = poke1.hp;
  battleState.pokemon2HP = poke2.hp;
  battleState.currentTurn = 0;
  battleState.battleActive = true;
  battleState.battleLog = [];

  displayPokemon();

  setupSection.style.display = "none";
  battleSection.style.display = "block";

  addLogEntry(
    `${poke1.name.toUpperCase()} vs ${poke2.name.toUpperCase()}! Battle Start!`,
  );
  addLogEntry(
    "Battle will last up to 10 turns. The Pokemon with more health wins!",
  );
  addLogEntry(
    `Turn order based on Speed: ${poke1.name} (${poke1.speedStat}) vs ${poke2.name} (${poke2.speedStat})`,
  );

  await runBattle();
}

function displayPokemon() {
  const p1 = battleState.pokemon1;
  const p2 = battleState.pokemon2;

  document.getElementById("pokemon1Name").textContent = p1.name;
  document.getElementById("pokemon1Img").src = p1.image;
  document.getElementById("pokemon1Img").alt = p1.name;
  document.getElementById("pokemon1HP").textContent =
    `${battleState.pokemon1HP}/${p1.hp}`;
  document.getElementById("pokemon1Attack").textContent = p1.attack;
  document.getElementById("pokemon1Defense").textContent = p1.defense;

  document.getElementById("pokemon2Name").textContent = p2.name;
  document.getElementById("pokemon2Img").src = p2.image;
  document.getElementById("pokemon2Img").alt = p2.name;
  document.getElementById("pokemon2HP").textContent =
    `${battleState.pokemon2HP}/${p2.hp}`;
  document.getElementById("pokemon2Attack").textContent = p2.attack;
  document.getElementById("pokemon2Defense").textContent = p2.defense;

  updateHealthBars();
}

function updateHealthBars() {
  const p1HealthPercent =
    (battleState.pokemon1HP / battleState.pokemon1.hp) * 100;
  const p2HealthPercent =
    (battleState.pokemon2HP / battleState.pokemon2.hp) * 100;

  document.getElementById("pokemon1HealthBar").style.width =
    Math.max(0, p1HealthPercent) + "%";
  document.getElementById("pokemon2HealthBar").style.width =
    Math.max(0, p2HealthPercent) + "%";

  document.getElementById("pokemon1HP").textContent =
    `${Math.max(0, battleState.pokemon1HP)}/${battleState.pokemon1.hp}`;
  document.getElementById("pokemon2HP").textContent =
    `${Math.max(0, battleState.pokemon2HP)}/${battleState.pokemon2.hp}`;
}

function addLogEntry(text, type = "normal") {
  const logContent = document.getElementById("battleLog");
  const entry = document.createElement("p");
  entry.className = `log-entry ${type}`;
  entry.textContent = text;
  logContent.appendChild(entry);
  logContent.scrollTop = logContent.scrollHeight;
  battleState.battleLog.push(text);
}

function attemptAttack(attacker, defender) {
  const speedDifference = defender.speedStat - attacker.speedStat;
  const evasionChance = Math.max(0, Math.min(0.4, speedDifference / 100));

  const roll = Math.random();

  return roll > evasionChance;
}

function calculateDamage(attacker, defender) {
  const baseDamage = attacker.attack - defender.defense * 0.5;
  const damage = Math.max(1, baseDamage + Math.floor(Math.random() * 20 - 10)); // Random variance
  return Math.floor(damage);
}

async function runBattle() {
  const p1 = battleState.pokemon1;
  const p2 = battleState.pokemon2;

  for (let turn = 1; turn <= battleState.maxTurns; turn++) {
    battleState.currentTurn = turn;
    document.getElementById("turnCounter").textContent = turn;

    addLogEntry(`\n--- TURN ${turn} ---`, "normal");
    const p1Faster = p1.speedStat >= p2.speedStat;

    if (p1Faster) {
      await executeTurnAttack(p1, p2, "pokemon1", "pokemon2");
      if (battleState.pokemon2HP <= 0) {
        break;
      }

      await executeTurnAttack(p2, p1, "pokemon2", "pokemon1");
      if (battleState.pokemon1HP <= 0) {
        break;
      }
    } else {
      await executeTurnAttack(p2, p1, "pokemon2", "pokemon1");
      if (battleState.pokemon1HP <= 0) {
        break;
      }

      await executeTurnAttack(p1, p2, "pokemon1", "pokemon2");
      if (battleState.pokemon2HP <= 0) {
        break;
      }
    }

    await delay(1500);
  }

  endBattle();
}

async function executeTurnAttack(
  attacker,
  defender,
  attackerClass,
  defenderClass,
) {
  const hits = attemptAttack(attacker, defender);

  const attackerElement = document.querySelector(`.${attackerClass}`);
  if (attackerElement) {
    attackerElement.classList.add("attacking");
    setTimeout(() => attackerElement.classList.remove("attacking"), 500);
  }

  if (!hits) {
    addLogEntry(
      `${attacker.name} tried to attack ${defender.name} but it MISSED!`,
      "normal",
    );
  } else {
    const damage = calculateDamage(attacker, defender);

    if (attackerClass === "pokemon1") {
      battleState.pokemon2HP -= damage;
    } else {
      battleState.pokemon1HP -= damage;
    }

    addLogEntry(
      `${attacker.name} attacks ${defender.name} for ${damage} damage!`,
      "critical",
    );
  }

  updateHealthBars();

  await delay(800);
}

function endBattle() {
  battleState.battleActive = false;
  const resultSection = document.getElementById("resultSection");
  const resultText = document.getElementById("resultText");
  const p1 = battleState.pokemon1;
  const p2 = battleState.pokemon2;

  let winner;
  if (battleState.pokemon1HP > battleState.pokemon2HP) {
    winner = p1.name;
    resultText.innerHTML = ` ${p1.name.toUpperCase()} WINS! <br><small>${p1.name}: ${Math.max(0, battleState.pokemon1HP)} HP remaining</small>`;
    resultText.style.color = "#4caf50";
  } else if (battleState.pokemon2HP > battleState.pokemon1HP) {
    winner = p2.name;
    resultText.innerHTML = ` ${p2.name.toUpperCase()} WINS! <br><small>${p2.name}: ${Math.max(0, battleState.pokemon2HP)} HP remaining</small>`;
    resultText.style.color = "#f5576c";
  } else {
    winner = "TIE";
    resultText.innerHTML = ` IT'S A TIE! <br><small>Both Pokemon have equal health remaining</small>`;
    resultText.style.color = "#667eea";
  }

  addLogEntry(`\n Battle Ended! ${winner} is the winner!`, "success");

  resultSection.style.display = "block";

  setTimeout(() => {
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 300);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
