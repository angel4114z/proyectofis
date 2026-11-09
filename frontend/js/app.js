const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "tinder-ud-access-token";

const state = {
  token: localStorage.getItem(TOKEN_KEY),
};

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });
  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("El servidor devolvió una respuesta que no es válida.");
    }
  }
  if (!response.ok) {
    throw new Error(data?.detail || `Error del servidor (${response.status}).`);
  }
  return data;
}

function showMessage(element, message, kind = "") {
  element.textContent = message;
  element.className = `message${kind ? ` message-${kind}` : ""}`;
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function createProfileCard(profile, options = {}) {
  const card = document.createElement("article");
  card.className = "profile-card";
  card.append(createTextElement("p", "eyebrow", profile.faculty || "Estudiante"));
  card.append(createTextElement("h3", "profile-name", profile.name));
  card.append(
    createTextElement(
      "p",
      "profile-location",
      profile.campus ? `Sede ${profile.campus}` : "Sede no indicada",
    ),
  );
  card.append(
    createTextElement(
      "p",
      "profile-biography",
      profile.biography || "Este estudiante aún no ha agregado una biografía.",
    ),
  );
  card.append(
    createTextElement(
      "p",
      "profile-interests",
      profile.interests.length
        ? `Intereses: ${profile.interests.join(", ")}`
        : "Sin intereses registrados",
    ),
  );

  if (options.showReactions) {
    const actions = document.createElement("div");
    actions.className = "reaction-actions";

    const dislikeButton = createTextElement(
      "button",
      "button button-secondary",
      "Pasar",
    );
    dislikeButton.type = "button";
    dislikeButton.addEventListener("click", () =>
      submitReaction(profile, "dislike", dislikeButton),
    );

    const likeButton = createTextElement(
      "button",
      "button button-primary",
      "Me interesa",
    );
    likeButton.type = "button";
    likeButton.addEventListener("click", () =>
      submitReaction(profile, "like", likeButton),
    );

    actions.append(dislikeButton, likeButton);
    card.append(actions);
  }
  return card;
}

async function submitReaction(profile, type, button) {
  button.disabled = true;
  const message = document.getElementById("app-message");
  try {
    const result = await apiRequest("/reactions", {
      method: "POST",
      body: { target_student_id: profile.student_id, type },
    });
    showMessage(
      message,
      result.matched
        ? `¡Hay un match con ${profile.name}! Ya puedes encontrarlo en Matches.`
        : "Reacción guardada. Puedes seguir explorando.",
      "success",
    );
    await loadDiscovery();
  } catch (error) {
    showMessage(message, error.message, "error");
    button.disabled = false;
  }
}

async function loadDiscovery() {
  const results = document.getElementById("discovery-results");
  results.replaceChildren(createTextElement("p", "muted", "Cargando perfiles..."));
  try {
    const profiles = await apiRequest("/profiles");
    results.replaceChildren();
    if (!profiles.length) {
      results.append(
        createTextElement(
          "p",
          "empty-state",
          "No hay más perfiles recomendados. Prueba la búsqueda manual.",
        ),
      );
      return;
    }
    profiles.forEach((profile) =>
      results.append(createProfileCard(profile, { showReactions: true })),
    );
  } catch (error) {
    results.replaceChildren();
    showMessage(document.getElementById("app-message"), error.message, "error");
  }
}

async function searchProfiles(event) {
  event.preventDefault();
  const results = document.getElementById("search-results");
  const formData = new FormData(event.currentTarget);
  const query = new URLSearchParams();
  for (const field of ["faculty", "campus", "interest"]) {
    const value = String(formData.get(field) || "").trim();
    if (value) {
      query.set(field, value);
    }
  }

  results.replaceChildren(createTextElement("p", "muted", "Buscando perfiles..."));
  try {
    const suffix = query.size ? `?${query.toString()}` : "";
    const profiles = await apiRequest(`/profiles/search${suffix}`);
    results.replaceChildren();
    if (!profiles.length) {
      results.append(createTextElement("p", "empty-state", "No se encontraron perfiles."));
      return;
    }
    profiles.forEach((profile) => results.append(createProfileCard(profile)));
  } catch (error) {
    results.replaceChildren();
    showMessage(document.getElementById("app-message"), error.message, "error");
  }
}

async function loadMatches() {
  const results = document.getElementById("matches-results");
  results.replaceChildren(createTextElement("p", "muted", "Cargando matches..."));
  try {
    const matches = await apiRequest("/matches");
    results.replaceChildren();
    if (!matches.length) {
      results.append(
        createTextElement("p", "empty-state", "Aún no tienes matches."),
      );
      return;
    }
    matches.forEach((match) => {
      const card = createProfileCard(match.other_student);
      card.append(
        createTextElement(
          "p",
          "match-date",
          `Conexión desde ${new Date(match.created_at).toLocaleDateString("es-CO")}`,
        ),
      );
      results.append(card);
    });
  } catch (error) {
    results.replaceChildren();
    showMessage(document.getElementById("app-message"), error.message, "error");
  }
}

function showView(viewName) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = view.id !== `view-${viewName}`;
  });
  if (viewName === "discover") {
    loadDiscovery();
  } else if (viewName === "matches") {
    loadMatches();
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  state.token = null;
}

function initializeIndexPage() {
  const loginPanel = document.getElementById("login-panel");
  const application = document.getElementById("application");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const appMessage = document.getElementById("app-message");

  function showApplication(name) {
    loginPanel.hidden = true;
    application.hidden = false;
    document.getElementById("student-name").textContent = name;
    showView("discover");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    showMessage(loginMessage, "Validando credenciales...");
    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: formData.get("email"),
          password: formData.get("password"),
        },
      });
      state.token = result.access_token;
      localStorage.setItem(TOKEN_KEY, state.token);
      loginForm.reset();
      showMessage(loginMessage, "");
      showApplication(result.student.name);
    } catch (error) {
      showMessage(loginMessage, error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      showMessage(appMessage, "");
      showView(button.dataset.view);
    });
  });
  document.getElementById("refresh-button").addEventListener("click", loadDiscovery);
  document
    .getElementById("refresh-matches-button")
    .addEventListener("click", loadMatches);
  document.getElementById("search-form").addEventListener("submit", searchProfiles);
  document.getElementById("logout-button").addEventListener("click", () => {
    clearSession();
    application.hidden = true;
    loginPanel.hidden = false;
    showMessage(loginMessage, "Sesión cerrada en este navegador.", "success");
  });

  if (state.token) {
    apiRequest("/profiles/me")
      .then((profile) => showApplication(profile.name))
      .catch((error) => {
        clearSession();
        loginPanel.hidden = false;
        application.hidden = true;
        showMessage(loginMessage, error.message, "error");
      });
  }
}

function initializeProfilePage() {
  const form = document.getElementById("profile-form");
  const message = document.getElementById("profile-message");
  const submitButton = form.querySelector('button[type="submit"]');

  if (!state.token) {
    showMessage(message, "Inicia sesión antes de editar tu perfil.", "error");
    form.hidden = true;
    return;
  }

  apiRequest("/profiles/me")
    .then((profile) => {
      document.getElementById("profile-name").textContent = profile.name;
      form.elements.biography.value = profile.biography;
      form.elements.faculty.value = profile.faculty;
      form.elements.campus.value = profile.campus;
      form.elements.interests.value = profile.interests.join(", ");
    })
    .catch((error) => {
      clearSession();
      form.hidden = true;
      showMessage(message, error.message, "error");
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    const formData = new FormData(form);
    try {
      const profile = await apiRequest("/profiles/me", {
        method: "PUT",
        body: {
          biography: formData.get("biography"),
          faculty: formData.get("faculty"),
          campus: formData.get("campus"),
          interests: String(formData.get("interests") || "")
            .split(",")
            .map((interest) => interest.trim())
            .filter(Boolean),
        },
      });
      form.elements.interests.value = profile.interests.join(", ");
      showMessage(message, "Tu perfil se guardó correctamente.", "success");
    } catch (error) {
      showMessage(message, error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById("profile-logout-button").addEventListener("click", () => {
    clearSession();
    window.location.href = "../index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile-form")) {
    initializeProfilePage();
  } else {
    initializeIndexPage();
  }
});