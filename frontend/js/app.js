const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "tinder-ud-access-token";

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  studentId: null,
};

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }
  const isFormData = options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: isFormData
      ? options.body
      : options.body === undefined
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

function createPhotoPlaceholder(name) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return createTextElement(
    "div",
    "profile-photo profile-photo-placeholder",
    initials,
  );
}

function createProfileCard(profile, options = {}) {
  const card = document.createElement("article");
  card.className = "profile-card";
  if (profile.photo_url) {
    const photo = document.createElement("img");
    photo.className = "profile-photo";
    photo.src = `${API_BASE_URL}${profile.photo_url}`;
    photo.alt = `Fotografía de ${profile.name}`;
    photo.loading = "lazy";
    photo.addEventListener(
      "error",
      () => photo.replaceWith(createPhotoPlaceholder(profile.name)),
      { once: true },
    );
    card.append(photo);
  } else {
    card.append(createPhotoPlaceholder(profile.name));
  }
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
      const chatButton = createTextElement(
        "button",
        "button button-primary",
        "Abrir chat",
      );
      chatButton.type = "button";
      chatButton.addEventListener("click", () => {
        showView("chat");
        document.dispatchEvent(
          new CustomEvent("chat:open", {
            detail: { connectionId: match.connection_id },
          }),
        );
      });
      card.append(
        createTextElement(
          "p",
          "match-date",
          `Conexión desde ${new Date(match.created_at).toLocaleDateString("es-CO")}`,
        ),
      );
      card.append(chatButton);
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
  } else if (viewName === "chat") {
    loadChatConversations();
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  state.token = null;
  state.studentId = null;
}

async function loadChatConversations(connectionToSelect) {
  const select = document.getElementById("chat-conversation");
  const messages = document.getElementById("chat-messages");
  if (!select || !messages) {
    return;
  }
  try {
    const matches = await apiRequest("/matches");
    select.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement("option");
      empty.textContent = "Aún no tienes matches";
      empty.value = "";
      select.append(empty);
      document.getElementById("chat-form").hidden = true;
      messages.replaceChildren(
        createTextElement("p", "empty-state", "Necesitas un match para usar el chat."),
      );
      return;
    }
    document.getElementById("chat-form").hidden = false;
    matches.forEach((match) => {
      const option = document.createElement("option");
      option.value = match.connection_id;
      option.textContent = match.other_student.name;
      select.append(option);
    });
    if (
      connectionToSelect &&
      matches.some((match) => match.connection_id === connectionToSelect)
    ) {
      select.value = connectionToSelect;
    }
    await loadChatMessages(select.value);
  } catch (error) {
    showMessage(document.getElementById("app-message"), error.message, "error");
  }
}

async function loadChatMessages(connectionId) {
  const messagesElement = document.getElementById("chat-messages");
  if (!connectionId) {
    return;
  }
  try {
    const messages = await apiRequest(
      `/matches/${encodeURIComponent(connectionId)}/messages`,
    );
    messagesElement.replaceChildren();
    if (!messages.length) {
      messagesElement.append(
        createTextElement("p", "empty-state", "Aún no hay mensajes."),
      );
    } else {
      messages.forEach((message) => {
        const ownMessage = message.sender_student_id === state.studentId;
        const bubble = createTextElement(
          "div",
          `chat-bubble${ownMessage ? " chat-bubble-own" : ""}`,
          message.text,
        );
        const time = createTextElement(
          "time",
          "chat-time",
          new Date(message.created_at).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        bubble.append(time);
        messagesElement.append(bubble);
      });
      messagesElement.scrollTop = messagesElement.scrollHeight;
    }
  } catch (error) {
    showMessage(document.getElementById("app-message"), error.message, "error");
  }
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
      state.studentId = result.student.id;
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
  document
    .getElementById("chat-conversation")
    .addEventListener("change", (event) => {
      loadChatMessages(event.currentTarget.value);
    });
  document.getElementById("chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const connectionId = document.getElementById("chat-conversation").value;
    const textInput = document.getElementById("chat-text");
    const text = textInput.value.trim();
    if (!connectionId || !text) {
      return;
    }
    try {
      await apiRequest(
        `/matches/${encodeURIComponent(connectionId)}/messages`,
        {
          method: "POST",
          body: { text },
        },
      );
      textInput.value = "";
      await loadChatMessages(connectionId);
    } catch (error) {
      showMessage(appMessage, error.message, "error");
    }
  });
  document.addEventListener("chat:open", (event) => {
    loadChatConversations(event.detail.connectionId);
  });
  document.getElementById("logout-button").addEventListener("click", () => {
    clearSession();
    application.hidden = true;
    loginPanel.hidden = false;
    showMessage(loginMessage, "Sesión cerrada en este navegador.", "success");
  });

  if (state.token) {
    apiRequest("/profiles/me")
      .then((profile) => {
        state.studentId = profile.student_id;
        showApplication(profile.name);
      })
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
      updateProfilePhotoPreview(profile.photo_url);
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

  document
    .getElementById("profile-photo")
    .addEventListener("change", (event) => {
      const file = event.currentTarget.files[0];
      if (!file) {
        return;
      }
      const preview = document.getElementById("profile-photo-preview");
      const placeholder = document.getElementById("profile-photo-placeholder");
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
      placeholder.hidden = true;
    });

  document
    .getElementById("upload-photo-button")
    .addEventListener("click", async () => {
      const photoInput = document.getElementById("profile-photo");
      const file = photoInput.files[0];
      if (!file) {
        showMessage(message, "Selecciona una fotografía primero.", "error");
        return;
      }
      const uploadButton = document.getElementById("upload-photo-button");
      uploadButton.disabled = true;
      try {
        const formData = new FormData();
        formData.append("photo", file);
        const result = await apiRequest("/profiles/me/photo", {
          method: "POST",
          body: formData,
        });
        updateProfilePhotoPreview(result.photo_url);
        showMessage(message, "La fotografía se subió correctamente.", "success");
      } catch (error) {
        showMessage(message, error.message, "error");
      } finally {
        uploadButton.disabled = false;
      }
    });

  document
    .getElementById("delete-photo-button")
    .addEventListener("click", async () => {
      try {
        await apiRequest("/profiles/me/photo", { method: "DELETE" });
        document.getElementById("profile-photo").value = "";
        updateProfilePhotoPreview(null);
        showMessage(message, "La fotografía se eliminó.", "success");
      } catch (error) {
        showMessage(message, error.message, "error");
      }
    });

  document.getElementById("profile-logout-button").addEventListener("click", () => {
    clearSession();
    window.location.href = "../index.html";
  });
}

function updateProfilePhotoPreview(photoUrl) {
  const preview = document.getElementById("profile-photo-preview");
  const placeholder = document.getElementById("profile-photo-placeholder");
  if (!preview || !placeholder) {
    return;
  }
  if (photoUrl) {
    preview.src = `${API_BASE_URL}${photoUrl}`;
    preview.hidden = false;
    placeholder.hidden = true;
  } else {
    preview.removeAttribute("src");
    preview.hidden = true;
    placeholder.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile-form")) {
    initializeProfilePage();
  } else {
    initializeIndexPage();
  }
});