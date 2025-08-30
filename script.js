const pokedex = document.getElementById("pokedex");
const searchInput = document.getElementById("search");
const typeFilters = document.getElementById("type-filters");

let allPokemon = [];
let currentTypeFilter = null;

// Lista dos tipos da 1ª geração
const gen1Types = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
];

const fetchGeneration = async (start, end) => {
  pokedex.innerHTML = "";
  document.getElementById("loader").style.display = "block";
  allPokemon = [];

  for (let i = start; i <= end; i++) {
    await getPokemon(i);
  }

  document.getElementById("loader").style.display = "none";
  createTypeButtons();
  renderPokemon(allPokemon);
};

const getPokemon = async (id) => {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  const [res, speciesRes] = await Promise.all([fetch(url), fetch(speciesUrl)]);

  const pokemon = await res.json();
  const species = await speciesRes.json();

  const descriptionEntry = species.flavor_text_entries.find(
    (entry) => entry.language.name === "pt" || entry.language.name === "en"
  );

  const description = descriptionEntry
    ? descriptionEntry.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ")
    : "Descrição não disponível.";

  allPokemon.push({ ...pokemon, description });
};

const renderPokemon = (list) => {
  pokedex.innerHTML = "";
  list.forEach((pokemon) => createPokemonCard(pokemon));
};

const generations = [
  { name: "Geração 1", start: 1, end: 151 },
  { name: "Geração 2", start: 152, end: 251 },
  { name: "Geração 3", start: 252, end: 386 },
  { name: "Geração 4", start: 387, end: 493 },
  { name: "Geração 5", start: 494, end: 649 },
  { name: "Geração 6", start: 650, end: 721 },
  { name: "Geração 7", start: 722, end: 809 },
  { name: "Geração 8", start: 810, end: 905 },
  { name: "Geração 9", start: 906, end: 1025 },
];

const createGenerationButtons = () => {
  const container = document.getElementById("generation-selector");
  container.innerHTML = "";

  generations.forEach((gen, index) => {
    const btn = document.createElement("button");
    btn.textContent = gen.name;
    btn.addEventListener("click", () => {
      currentTypeFilter = null;
      searchInput.value = "";
      fetchGeneration(gen.start, gen.end);
    });
    container.appendChild(btn);
  });
};

const createPokemonCard = (pokemon) => {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  card.style.background = getTypeBackground(pokemon.types);

  const types = pokemon.types.map((t) => capitalize(t.type.name)).join(" / ");
  const abilities = pokemon.abilities
    .map((ab) => capitalize(ab.ability.name))
    .join(", ");
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);

  const title = document.createElement("h2");
  title.textContent = `#${pokemon.id
    .toString()
    .padStart(3, "0")} - ${capitalize(pokemon.name)}`;

  const image = document.createElement("img");
  image.alt = pokemon.name;
  image.classList.add("pokemon-sprite");

  if (pokemon.id <= 649) {
    // ✅ Sprites animados do Showdown até o #649
    const normalGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`;
    const shinyGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemon.id}.gif`;

    image.src = normalGif;

    image.addEventListener("mouseenter", () => {
      image.src = shinyGif;
    });

    image.addEventListener("mouseleave", () => {
      image.src = normalGif;
    });
  } else {
    // 🧩 Para IDs 650+, usar front_default com animação CSS
    const frontSprite = pokemon.sprites.front_default;
    const shinySprite = pokemon.sprites.front_shiny;

    image.src = frontSprite;

    image.addEventListener("mouseenter", () => {
      if (shinySprite) image.src = shinySprite;
    });

    image.addEventListener("mouseleave", () => {
      image.src = frontSprite;
    });
  }

  card.appendChild(title);
  card.appendChild(image);

  const infoHTML = `
    <p><strong>Tipo:</strong> ${types}</p>
    <p><strong>Altura:</strong> ${height} m</p>
    <p><strong>Peso:</strong> ${weight} kg</p>
    <p><strong>Habilidades:</strong> ${abilities}</p>
    <p><strong>Descrição:</strong> ${pokemon.description}</p>
  `;
  card.innerHTML += infoHTML;

  pokedex.appendChild(card);
  card.addEventListener("click", () => openPokemonModal(pokemon.id));
};

const createTypeButtons = () => {
  typeFilters.innerHTML = ""; // Evita duplicação
  const typeCounts = {};

  allPokemon.forEach((p) => {
    p.types.forEach((t) => {
      const typeName = t.type.name;
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    });
  });

  const uniqueTypes = Object.keys(typeCounts).sort();

  uniqueTypes.forEach((type) => {
    const btn = document.createElement("button");
    btn.setAttribute("data-type", type);

    const icon = document.createElement("img");
    icon.src = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;
    icon.alt = type;
    icon.classList.add("type-icon");

    btn.appendChild(icon);
    btn.append(` ${capitalize(type)} (${typeCounts[type]})`);

    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#type-filters button")
        .forEach((b) => b.classList.remove("active"));
      if (currentTypeFilter === type) {
        currentTypeFilter = null;
        btn.classList.remove("active");
        filterAndSearch();
      } else {
        currentTypeFilter = type;
        btn.classList.add("active");
        filterAndSearch();
      }
    });

    typeFilters.appendChild(btn);
  });
};

const filterAndSearch = () => {
  const query = searchInput.value.toLowerCase();
  let filtered = allPokemon;

  if (currentTypeFilter) {
    filtered = filtered.filter((p) =>
      p.types.some((t) => t.type.name === currentTypeFilter)
    );
  }

  if (query) {
    filtered = filtered.filter(
      (p) => p.name.includes(query) || p.id.toString() === query
    );
  }

  renderPokemon(filtered);
};

const openPokemonModal = async (id) => {
  const modal = document.getElementById("pokemon-modal");
  const modalBody = document.getElementById("modal-body");
  modal.classList.remove("hidden");
  modalBody.innerHTML = "Carregando...";

  try {
    const [pokemonRes, speciesRes, encounterRes] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`),
    ]);

    const pokemon = await pokemonRes.json();
    const species = await speciesRes.json();
    const encounters = await encounterRes.json();

    const name = capitalize(pokemon.name);
    const types = pokemon.types.map((t) => capitalize(t.type.name)).join(" / ");
    const abilities = pokemon.abilities
      .map((a) => capitalize(a.ability.name))
      .join(", ");
    const moves = pokemon.moves.map((m) => capitalize(m.move.name)).join(", ");
    const stats = pokemon.stats
      .map(
        (stat) =>
          `<li><strong>${capitalize(stat.stat.name)}:</strong> ${
            stat.base_stat
          }</li>`
      )
      .join("");
    const habitat = species.habitat
      ? capitalize(species.habitat.name)
      : "Desconhecido";
    const locations = encounters.length
      ? encounters
          .map((loc) => capitalize(loc.location_area.name.replace(/-/g, " ")))
          .join(", ")
      : "Desconhecido";

    const normalGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`;
    const shinyGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemon.id}.gif`;

    // APLICA FUNDO BASEADO NOS TIPOS
    modalBody.style.background = getTypeBackground(pokemon.types);
    modalBody.style.borderRadius = "12px";
    modalBody.style.padding = "20px";
    modalBody.style.color = "#fff"; // garante legibilidade no modo escuro

    modalBody.innerHTML = `
      <h2>${name} (#${pokemon.id})</h2>
      <img id="modal-sprite" src="${normalGif}" alt="${name}" />
      <br><br>
      <button id="toggle-shiny">Alternar Shiny</button>
      <p><strong>Tipo:</strong> ${types}</p>
      <p><strong>Habilidades:</strong> ${abilities}</p>
      <p><strong>Habitat:</strong> ${habitat}</p>
      <p><strong>Encontrado em:</strong> ${locations}</p>
      <p><strong>Golpes:</strong> ${moves}</p>
      <h3>Status Base:</h3>
      <ul>${stats}</ul>
    `;

    // Lógica de alternância entre normal e shiny
    const img = document.getElementById("modal-sprite");
    const toggleBtn = document.getElementById("toggle-shiny");
    let isShiny = false;

    toggleBtn.addEventListener("click", () => {
      isShiny = !isShiny;
      img.src = isShiny ? shinyGif : normalGif;
    });
  } catch (error) {
    modalBody.innerHTML = "<p>Erro ao carregar dados do Pokémon.</p>";
    console.error(error);
  }
};

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("pokemon-modal").classList.add("hidden");
});

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("pokemon-modal").classList.add("hidden");
});

searchInput.addEventListener("input", filterAndSearch);

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

createGenerationButtons();
fetchGeneration(1, 151); // Começa com a Geração 1

// Temas por tipo
const typeBackgrounds = {
  fire: "#ffcccb",
  water: "#cce6ff",
  grass: "#ccffcc",
  electric: "#ffffcc",
  psychic: "#ffccff",
  ice: "#e0ffff",
  dragon: "#e6ccff",
  dark: "#dcdcdc",
  fairy: "#ffe6f0",
  bug: "#f0f8e6",
  normal: "#f5f5f5",
  flying: "#e6f0ff",
  fighting: "#ffe0cc",
  poison: "#f0ccff",
  ground: "#f9e4cc",
  rock: "#e6d9cc",
  ghost: "#d9ccff",
  steel: "#e0e0e0",
};

// Ativa plano de fundo baseado no tipo
function applyTypeBackground(type) {
  const bg = typeBackgrounds[type] || defaultBackground;
  if (!isDarkMode) document.body.style.backgroundColor = bg;
}

// Restaura fundo padrão
const defaultBackground =
  'url("https://raw.githubusercontent.com/HybridShivam/Pokemon/master/assets/backgrounds/grass.jpg")';
document.body.style.backgroundImage = defaultBackground;

// Atualiza quando clica no tipo
document.querySelectorAll("#type-filters").forEach((container) => {
  container.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const type = e.target.textContent.toLowerCase();
      if (gen1Types.includes(type)) applyTypeBackground(type);
      else document.body.style.backgroundColor = ""; // reset
    }
  });
});

let isDarkMode = false;

const toggleThemeBtn = document.getElementById("toggle-theme");
toggleThemeBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);

  if (isDarkMode) {
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "#111";
    toggleThemeBtn.textContent = "Modo Claro";
  } else {
    document.body.style.backgroundImage = defaultBackground;
    document.body.style.backgroundColor = "";
    toggleThemeBtn.textContent = "Modo Noturno";
  }
});

const typeColors = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const getTypeBackground = (types) => {
  if (types.length === 1) {
    const color = typeColors[types[0].type.name] || "#AAA";
    return color;
  }

  const color1 = typeColors[types[0].type.name] || "#AAA";
  const color2 = typeColors[types[1].type.name] || "#CCC";

  return `linear-gradient(135deg, ${color1}, ${color2})`;
};

const typeBackgroundImages = {
  normal:
    "https://images.unsplash.com/photo-1613758947304-c953b92e7d4f?auto=format&fit=crop&w=1500&q=80",
  fire: "https://images.unsplash.com/photo-1587031672280-e3c5f0c383a7?auto=format&fit=crop&w=1500&q=80",
  water:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1500&q=80",
  electric:
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1500&q=80",
  grass:
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1500&q=80",
  ice: "https://images.unsplash.com/photo-1608889176216-2b1863e8e9c7?auto=format&fit=crop&w=1500&q=80",
  fighting:
    "https://images.unsplash.com/photo-1598961713474-263f2f944e44?auto=format&fit=crop&w=1500&q=80",
  poison:
    "https://images.unsplash.com/photo-1605011083763-166a58f4f6f7?auto=format&fit=crop&w=1500&q=80",
  ground:
    "https://images.unsplash.com/photo-1622482297967-74249b35ab36?auto=format&fit=crop&w=1500&q=80",
  flying:
    "https://images.unsplash.com/photo-1508264165352-258a6c1448e2?auto=format&fit=crop&w=1500&q=80",
  psychic:
    "https://images.unsplash.com/photo-1533587851505-7c1dc0c1d04e?auto=format&fit=crop&w=1500&q=80",
  bug: "https://images.unsplash.com/photo-1551085254-e96b203bafa7?auto=format&fit=crop&w=1500&q=80",
  rock: "https://images.unsplash.com/photo-1595341888013-7f3f3e41f368?auto=format&fit=crop&w=1500&q=80",
  ghost:
    "https://images.unsplash.com/photo-1617891296665-fd02dc9f9050?auto=format&fit=crop&w=1500&q=80",
  dragon:
    "https://images.unsplash.com/photo-1542973742-768b6df7c25a?auto=format&fit=crop&w=1500&q=80",
  dark: "https://images.unsplash.com/photo-1523419637084-ef204efe4d2b?auto=format&fit=crop&w=1500&q=80",
  steel:
    "https://images.unsplash.com/photo-1537308158071-50c5c1f6c805?auto=format&fit=crop&w=1500&q=80",
  fairy:
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1500&q=80",
};

function updateBackground(typeFilter) {
  const app = document.body; // ou a div principal se tiver

  const background = typeFilter
    ? typeBackgroundImages[typeFilter] || defaultBackground
    : defaultBackground;

  app.style.backgroundImage = `url("${background}")`;
  app.style.backgroundSize = "cover";
  app.style.backgroundPosition = "center";
  app.style.transition = "background-image 0.5s ease-in-out";
}

// Fechar modal ao clicar fora do conteúdo
document.getElementById("pokemon-modal").addEventListener("click", (e) => {
  if (e.target.id === "pokemon-modal") {
    e.target.classList.add("hidden");
  }
});

// Fechar modal ao pressionar ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("pokemon-modal").classList.add("hidden");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  searchInput.focus();
});
