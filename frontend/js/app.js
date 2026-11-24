const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "tinder-ud-access-token";

// Límite de 10 MB y formatos permitidos para fotos en el chat
const MAX_CHAT_PHOTO_SIZE = 10 * 1024 * 1024;
const ALLOWED_CHAT_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  studentId: null,
  activeConnectionId: null,
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

function absolutePhotoUrl(photoUrl) {
  return photoUrl ? new URL(photoUrl, API_BASE_URL).href : null;
}

function profilePhotos(profile) {
  if (Array.isArray(profile.photo_urls) && profile.photo_urls.length) {
    return profile.photo_urls;
  }
  return profile.photo_url ? [profile.photo_url] : [];
}

function showProfileDetail(profile) {
  const searchForm = document.getElementById("search-form");
  const searchResults = document.getElementById("search-results");
  const detail = document.getElementById("profile-detail");
  const content = document.getElementById("profile-detail-content");
  const gallery = document.createElement("div");
  gallery.className = "profile-detail-gallery";
  const photos = profilePhotos(profile);

  if (photos.length) {
    photos.forEach((photoUrl, index) => {
      const photo = document.createElement("img");
      photo.className = "profile-detail-photo";
      photo.src = absolutePhotoUrl(photoUrl);
      photo.alt = `Fotografía ${index + 1} de ${profile.name}`;
      photo.loading = "lazy";
      photo.addEventListener(
        "error",
        () => photo.replaceWith(createPhotoPlaceholder(profile.name)),
        { once: true },
      );
      gallery.append(photo);
    });
  } else {
    gallery.append(createPhotoPlaceholder(profile.name));
  }

  const actions = document.createElement("div");
  actions.className = "reaction-actions";

  const dislikeButton = createTextElement(
    "button",
    "button button-secondary",
    "Pasar",
  );
  dislikeButton.type = "button";

  const likeButton = createTextElement(
    "button",
    "button button-primary",
    "Me interesa",
  );
  likeButton.type = "button";

  const handleDetailReaction = async (type, button) => {
    dislikeButton.disabled = true;
    likeButton.disabled = true;
    const saved = await submitReaction(profile, type, button, {
      refreshDiscovery: false,
    });
    if (saved) {
      const cardInSearch = searchResults.querySelector(
        `[data-student-id="${CSS.escape(profile.student_id)}"]`,
      );
      cardInSearch?.remove();
      if (!searchResults.querySelector(".profile-card")) {
        searchResults.replaceChildren(
          createTextElement(
            "p",
            "empty-state",
            "No quedan más perfiles en este resultado de búsqueda.",
          ),
        );
      }
      hideProfileDetail();
      document.getElementById("search-form").scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    } else {
      dislikeButton.disabled = false;
      likeButton.disabled = false;
    }
  };

  dislikeButton.addEventListener("click", () =>
    handleDetailReaction("dislike", dislikeButton),
  );
  likeButton.addEventListener("click", () =>
    handleDetailReaction("like", likeButton),
  );
  actions.append(dislikeButton, likeButton);

  const information = document.createElement("div");
  information.className = "profile-detail-information";
  information.append(
    createTextElement("p", "eyebrow", profile.faculty || "Estudiante"),
    createTextElement("h2", "profile-name", profile.name),
    createTextElement(
      "p",
      "profile-location",
      profile.campus ? `Sede ${profile.campus}` : "Sede no indicada",
    ),
    createTextElement("h3", "", "Biografía"),
    createTextElement(
      "p",
      "profile-biography",
      profile.biography || "Este estudiante aún no ha agregado una biografía.",
    ),
    createTextElement("h3", "", "Intereses"),
    createTextElement(
      "p",
      "profile-interests",
      profile.interests.length
        ? profile.interests.join(", ")
        : "Sin intereses registrados",
    ),
    actions,
  );
  content.replaceChildren(gallery, information);
  searchForm.hidden = true;
  searchResults.hidden = true;
  detail.hidden = false;
  document.getElementById("profile-detail-back").focus();
}

function hideProfileDetail() {
  document.getElementById("profile-detail").hidden = true;
  document.getElementById("search-form").hidden = false;
  document.getElementById("search-results").hidden = false;
}

function showStudentHeader(profile) {
  const photo = document.getElementById("student-photo");
  const placeholder = document.getElementById("student-photo-placeholder");
  document.getElementById("student-name").textContent = profile.name;
  photo.onload = null;
  photo.onerror = null;

  if (!profile.photo_url) {
    photo.hidden = true;
    photo.removeAttribute("src");
    placeholder.textContent = profile.name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    placeholder.hidden = false;
    return;
  }

  photo.onload = () => {
    photo.hidden = false;
    placeholder.hidden = true;
  };
  photo.onerror = () => {
    photo.hidden = true;
    placeholder.hidden = false;
  };
  photo.src = absolutePhotoUrl(profile.photo_url);
}

function createProfileCard(profile, options = {}) {
  const card = document.createElement("article");
  card.className = `profile-card${options.showReactions ? " discovery-card" : ""}`;
  card.dataset.studentId = profile.student_id;
  const primaryPhotoUrl = profilePhotos(profile)[0];
  if (primaryPhotoUrl) {
    const photo = document.createElement("img");
    photo.className = "profile-photo";
    photo.src = absolutePhotoUrl(primaryPhotoUrl);
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

  if (options.onViewProfile) {
    const viewButton = createTextElement(
      "button",
      "button button-secondary",
      "Ver perfil completo",
    );
    viewButton.type = "button";
    viewButton.addEventListener("click", () => options.onViewProfile(profile));
    card.append(viewButton);
  }

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

async function submitReaction(profile, type, button, options = {}) {
  const { refreshDiscovery = true } = options;
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
    if (refreshDiscovery) {
      await loadDiscovery();
    }
    return true;
  } catch (error) {
    showMessage(message, error.message, "error");
    button.disabled = false;
    return false;
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
    results.append(createProfileCard(profiles[0], { showReactions: true }));
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
    profiles.forEach((profile) =>
      results.append(
        createProfileCard(profile, { onViewProfile: showProfileDetail }),
      ),
    );
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
  state.activeConnectionId = null;
}

async function loadChatConversations(connectionToSelect) {
  const conversations = document.getElementById("chat-conversations");
  const messages = document.getElementById("chat-messages");
  if (!conversations || !messages) {
    return;
  }
  try {
    const matches = await apiRequest("/matches");
    conversations.replaceChildren();
    if (!matches.length) {
      state.activeConnectionId = null;
      document.getElementById("chat-form").hidden = true;
      conversations.append(
        createTextElement("p", "empty-state", "Aún no tienes conexiones."),
      );
      messages.replaceChildren(
        createTextElement("p", "empty-state", "Necesitas un match para usar el chat."),
      );
      return;
    }
    document.getElementById("chat-form").hidden = false;
    matches.forEach((match) => {
      const connectionButton = document.createElement("button");
      connectionButton.type = "button";
      connectionButton.className = "chat-connection-button";
      connectionButton.dataset.connectionId = match.connection_id;
      const primaryPhotoUrl = profilePhotos(match.other_student)[0];
      if (primaryPhotoUrl) {
        const photo = document.createElement("img");
        photo.className = "chat-connection-photo";
        photo.src = absolutePhotoUrl(primaryPhotoUrl);
        photo.alt = "";
        photo.addEventListener(
          "error",
          () =>
            photo.replaceWith(
              createTextElement(
                "span",
                "chat-connection-placeholder",
                match.other_student.name.slice(0, 1).toUpperCase(),
              ),
            ),
          { once: true },
        );
        connectionButton.append(photo);
      } else {
        connectionButton.append(
          createTextElement(
            "span",
            "chat-connection-placeholder",
            match.other_student.name.slice(0, 1).toUpperCase(),
          ),
        );
      }
      connectionButton.append(
        createTextElement("span", "chat-connection-name", match.other_student.name),
      );
      connectionButton.classList.toggle(
        "is-active",
        match.connection_id === (connectionToSelect || state.activeConnectionId),
      );
      connectionButton.addEventListener("click", () => {
        state.activeConnectionId = match.connection_id;
        conversations.querySelectorAll(".chat-connection-button").forEach((item) => {
          item.classList.toggle("is-active", item === connectionButton);
        });
        loadChatMessages(match.connection_id);
      });
      conversations.append(connectionButton);
    });
    const selectedMatch = matches.find(
      (match) =>
        match.connection_id === (connectionToSelect || state.activeConnectionId),
    ) || matches[0];
    state.activeConnectionId = selectedMatch.connection_id;
    const selectedButton = [...conversations.querySelectorAll(
      ".chat-connection-button",
    )].find(
      (button) => button.dataset.connectionId === selectedMatch.connection_id,
    );
    selectedButton?.classList.add("is-active");
    await loadChatMessages(selectedMatch.connection_id);
  } catch (error) {
    showMessage(document.getElementById("app-message"), error.message, "error");
  }
}

// Renderiza message.photo_url y message.text dentro de cada burbuja del chat
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
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble${ownMessage ? " chat-bubble-own" : ""}`;

        if (message.photo_url) {
          const photo = document.createElement("img");
          photo.className = "chat-image";
          photo.src = absolutePhotoUrl(message.photo_url);
          photo.alt = "Fotografía enviada en el chat";
          photo.loading = "lazy";
          bubble.append(photo);
        }

        if (message.text) {
          bubble.append(createTextElement("span", "", message.text));
        }

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
  const registerForm = document.getElementById("register-form");
  const toggleAuthButton = document.getElementById("toggle-auth-mode");
  const loginTitle = document.getElementById("login-title");
  const authEyebrow = document.getElementById("auth-eyebrow");
  const authSubtitle = document.getElementById("auth-subtitle");
  const demoHint = document.getElementById("demo-hint");
  const loginMessage = document.getElementById("login-message");
  const appMessage = document.getElementById("app-message");

  function showApplication(profile) {
    loginPanel.hidden = true;
    application.hidden = false;
    showStudentHeader(profile);
    showView("discover");
  }

  async function completeAuthentication(result, formElement) {
    state.token = result.access_token;
    state.studentId = result.student.id;
    localStorage.setItem(TOKEN_KEY, state.token);
    formElement.reset();
    showMessage(loginMessage, "");
    showMessage(appMessage, "");
    showApplication(result.student);
    const profile = await apiRequest("/profiles/me");
    state.studentId = profile.student_id;
    showStudentHeader(profile);
  }

  function setAuthMode(isRegistering) {
    loginForm.hidden = isRegistering;
    registerForm.hidden = !isRegistering;
    authEyebrow.textContent = isRegistering ? "Nuevo estudiante" : "Bienvenido";
    loginTitle.textContent = isRegistering ? "Crea tu cuenta" : "Inicia sesión";
    authSubtitle.textContent = isRegistering
      ? "Completa tus datos para crear tu perfil universitario."
      : "Ingresa con una cuenta existente o crea una nueva para explorar.";
    toggleAuthButton.textContent = isRegistering
      ? "Ya tengo cuenta"
      : "Crear cuenta";
    demoHint.hidden = isRegistering;
    showMessage(loginMessage, "");
  }

  toggleAuthButton?.addEventListener("click", () => {
    setAuthMode(!loginForm.hidden);
  });

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
      await completeAuthentication(result, loginForm);
    } catch (error) {
      if (state.token) {
        showMessage(appMessage, error.message, "error");
      } else {
        showMessage(loginMessage, error.message, "error");
      }
    } finally {
      submitButton.disabled = false;
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const allowedDomains = ["@gmail.com", "@hotmail.com"];

    if (!allowedDomains.some((domain) => email.endsWith(domain))) {
      showMessage(
        loginMessage,
        "El correo debe terminar en @gmail.com o @hotmail.com.",
        "error",
      );
      return;
    }

    if (password.length < 8) {
      showMessage(
        loginMessage,
        "La contraseña debe tener al menos 8 caracteres.",
        "error",
      );
      return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    showMessage(loginMessage, "Creando cuenta...");
    try {
      const interests = String(formData.get("interests") || "")
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean);
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          name: formData.get("name"),
          email,
          password,
          faculty: formData.get("faculty"),
          campus: formData.get("campus"),
          biography: formData.get("biography"),
          interests,
        },
      });
      await completeAuthentication(result, registerForm);
    } catch (error) {
      if (state.token) {
        showMessage(appMessage, error.message, "error");
      } else {
        showMessage(loginMessage, error.message, "error");
      }
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
    .getElementById("profile-detail-back")
    .addEventListener("click", hideProfileDetail);

  // Marca visualmente la selección de archivo y valida/sube la foto antes de enviar el mensaje
  const chatPhotoInput = document.getElementById("chat-photo");
  const chatPhotoButton = document.querySelector(".chat-photo-button");

  chatPhotoInput?.addEventListener("change", () => {
    const file = chatPhotoInput.files?.[0];
    chatPhotoButton?.classList.toggle("is-selected", Boolean(file));
    if (file) {
      document.getElementById("chat-text").placeholder = `Foto: ${file.name}`;
    } else {
      document.getElementById("chat-text").placeholder = "";
    }
  });

  document.getElementById("chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const connectionId = state.activeConnectionId;
    const textInput = document.getElementById("chat-text");
    const text = textInput.value.trim();
    const photoFile = chatPhotoInput?.files?.[0];

    if (!connectionId || (!text && !photoFile)) {
      return;
    }

    if (photoFile) {
      if (!ALLOWED_CHAT_PHOTO_TYPES.includes(photoFile.type)) {
        showMessage(
          appMessage,
          "Solo se permiten imágenes JPEG, PNG o WebP.",
          "error",
        );
        return;
      }
      if (photoFile.size > MAX_CHAT_PHOTO_SIZE) {
        showMessage(
          appMessage,
          "La fotografía del chat no puede superar los 10 MB.",
          "error",
        );
        return;
      }
    }

    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      let photoUrl = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append("photo", photoFile);
        const uploadResult = await apiRequest(
          `/matches/${encodeURIComponent(connectionId)}/photo`,
          {
            method: "POST",
            body: formData,
          },
        );
        photoUrl = uploadResult.photo_url;
      }

      await apiRequest(
        `/matches/${encodeURIComponent(connectionId)}/messages`,
        {
          method: "POST",
          body: {
            text,
            photo_url: photoUrl,
          },
        },
      );

      textInput.value = "";
      textInput.placeholder = "";
      if (chatPhotoInput) {
        chatPhotoInput.value = "";
      }
      chatPhotoButton?.classList.remove("is-selected");
      await loadChatMessages(connectionId);
    } catch (error) {
      showMessage(appMessage, error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  document.addEventListener("chat:open", (event) => {
    loadChatConversations(event.detail.connectionId);
  });
  document.getElementById("logout-button").addEventListener("click", () => {
    clearSession();
    setAuthMode(false);
    application.hidden = true;
    loginPanel.hidden = false;
    showMessage(loginMessage, "Sesión cerrada en este navegador.", "success");
  });

  if (state.token) {
    apiRequest("/profiles/me")
      .then((profile) => {
        state.studentId = profile.student_id;
        showApplication(profile);
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
  const photoForm = document.getElementById("photo-form");
  const message = document.getElementById("profile-message");
  const submitButton = form.querySelector('button[type="submit"]');
  const photoInput = photoForm.elements.photo;
  const photoGallery = document.getElementById("profile-photo-gallery");
  let savedPhotoUrls = [];
  let pendingPhotoUrls = [];

  function renderPhotoGallery(pendingFiles = []) {
    pendingPhotoUrls.forEach((url) => URL.revokeObjectURL(url));
    pendingPhotoUrls = [];
    photoGallery.replaceChildren();

    savedPhotoUrls.forEach((photoUrl, index) => {
      const item = document.createElement("figure");
      item.className = "profile-photo-item";
      const photo = document.createElement("img");
      photo.src = absolutePhotoUrl(photoUrl);
      photo.alt = `Fotografía ${index + 1} del perfil`;
      photo.addEventListener(
        "error",
        () => photo.replaceWith(createPhotoPlaceholder("Foto")),
        { once: true },
      );
      item.append(photo);
      if (index === 0) {
        item.append(createTextElement("figcaption", "photo-primary-label", "Foto principal"));
      }

      const filename = new URL(photoUrl, API_BASE_URL).pathname.split("/").pop();
      const deleteButton = createTextElement(
        "button",
        "button button-quiet",
        "Eliminar",
      );
      deleteButton.type = "button";
      deleteButton.dataset.photoFilename = filename;
      item.append(deleteButton);
      photoGallery.append(item);
    });

    pendingFiles.forEach((file) => {
      const item = document.createElement("figure");
      item.className = "profile-photo-item profile-photo-pending";
      const photo = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);
      pendingPhotoUrls.push(objectUrl);
      photo.src = objectUrl;
      photo.alt = `Vista previa: ${file.name}`;
      item.append(photo, createTextElement("figcaption", "", "Pendiente de guardar"));
      photoGallery.append(item);
    });

    if (!savedPhotoUrls.length && !pendingFiles.length) {
      photoGallery.append(
        createTextElement("p", "muted", "Aún no has agregado fotografías."),
      );
    }
  }

  async function reloadPhotoGallery() {
    const profile = await apiRequest("/profiles/me");
    savedPhotoUrls = profile.photo_urls?.length
      ? profile.photo_urls
      : profile.photo_url
        ? [profile.photo_url]
        : [];
    renderPhotoGallery();
  }

  if (!state.token) {
    showMessage(message, "Inicia sesión antes de editar tu perfil.", "error");
    form.hidden = true;
    photoForm.hidden = true;
    return;
  }

  apiRequest("/profiles/me")
    .then((profile) => {
      document.getElementById("profile-name").textContent = profile.name;
      form.elements.biography.value = profile.biography;
      form.elements.faculty.value = profile.faculty;
      form.elements.campus.value = profile.campus;
      form.elements.interests.value = profile.interests.join(", ");
      savedPhotoUrls = profile.photo_urls?.length
        ? profile.photo_urls
        : profile.photo_url
          ? [profile.photo_url]
          : [];
      renderPhotoGallery();
      document.getElementById("upload-photo-button").disabled = true;
    })
    .catch((error) => {
      clearSession();
      form.hidden = true;
      photoForm.hidden = true;
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

  photoInput.addEventListener("change", () => {
    const files = Array.from(photoInput.files);
    renderPhotoGallery(files);
    document.getElementById("upload-photo-button").disabled = !files.length;
  });

  photoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(photoInput.files);
    if (!files.length) {
      showMessage(message, "Selecciona una fotografía primero.", "error");
      return;
    }
    const uploadButton = document.getElementById("upload-photo-button");
    uploadButton.disabled = true;
    photoGallery.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });
    let uploadedCount = 0;
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("photo", file);
        const result = await apiRequest("/profiles/me/photo", {
          method: "POST",
          body: formData,
        });
        uploadedCount += 1;
        await waitForPhotoLoad(result.photo_url);
      }
      await reloadPhotoGallery();
      photoInput.value = "";
      document.getElementById("upload-photo-button").disabled = true;
      showMessage(
        message,
        files.length === 1
          ? "La fotografía se guardó correctamente."
          : `Se guardaron ${files.length} fotografías correctamente.`,
        "success",
      );
    } catch (error) {
      if (uploadedCount) {
        try {
          await reloadPhotoGallery();
        } catch (reloadError) {
          showMessage(
            message,
            `Se guardaron ${uploadedCount} fotos, pero la galería no pudo actualizarse: ${reloadError.message}`,
            "error",
          );
          return;
        }
        photoInput.value = "";
        showMessage(
          message,
          `El servidor aceptó ${uploadedCount} foto(s), pero el lote no se pudo completar o verificar: ${error.message}`,
          "error",
        );
      } else {
        showMessage(message, error.message, "error");
      }
    } finally {
      uploadButton.disabled = !photoInput.files.length;
      photoGallery.querySelectorAll("button").forEach((button) => {
        button.disabled = false;
      });
    }
  });

  photoGallery.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-photo-filename]");
    if (!deleteButton) {
      return;
    }
    deleteButton.disabled = true;
    try {
      await apiRequest(
        `/profiles/me/photo/${encodeURIComponent(deleteButton.dataset.photoFilename)}`,
        { method: "DELETE" },
      );
      await reloadPhotoGallery();
      showMessage(message, "La fotografía se eliminó.", "success");
    } catch (error) {
      showMessage(message, error.message, "error");
      deleteButton.disabled = false;
    }
  });

  document.getElementById("profile-logout-button").addEventListener("click", () => {
    clearSession();
    window.location.href = "../index.html";
  });
}

function waitForPhotoLoad(photoUrl) {
  const photo = new Image();
  return new Promise((resolve, reject) => {
    photo.addEventListener("load", resolve, { once: true });
    photo.addEventListener(
      "error",
      () => reject(new Error("La foto se guardó, pero no se pudo cargar.")),
      { once: true },
    );
    photo.src = absolutePhotoUrl(photoUrl);
    if (photo.complete) {
      if (photo.naturalWidth > 0) {
        resolve();
      } else {
        reject(new Error("La foto se guardó, pero no se pudo cargar."));
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile-form")) {
    initializeProfilePage();
  } else {
    initializeIndexPage();
  }
});