'use strict';

document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
BLOQUE 1: SESIÓN, ENTORNO, CADENAS Y VALORES POR DEFECTO
========================================================= */

  const params = new URLSearchParams(window.location.search);

  const usuario = (params.get("usuario") || "Invitado").trim();
  const rol = (params.get("rol") || "Cliente").trim();

  const idioma = navigator.language || "es-ES";
  const online = navigator.onLine;

  const fechaActual = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  function generarIdSeguro() {
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const array = new Uint32Array(4);
      window.crypto.getRandomValues(array);
      return Array.from(array, (num) => num.toString(16).padStart(8, "0")).join(
        "-",
      );
    }

    return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const sessionId =
    window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : generarIdSeguro();

  // Sanitización del correo
  const emailRaw = params.get("email") || "cliente@urbanstyle.com";
  const emailLimpio = emailRaw.trim().toLowerCase();

  const partesEmail = emailLimpio.split("@");
  const emailUsuario = partesEmail[0] || "cliente";
  const emailDominio = partesEmail[1] || "urbanstyle.com";

  // ID cliente con formato fijo de 6 dígitos
  const idCliente = (params.get("idCliente") || params.get("id") || "0")
    .toString()
    .replace(/\D/g, "")
    .padStart(6, "0")
    .slice(-6);

  // Preferencias por defecto
  const apodoParam = params.get("apodo");
  const apodo =
    apodoParam === null || apodoParam.trim() === ""
      ? "Cliente VIP"
      : apodoParam.trim();

  const membresiaParam = params.get("membresia");
  const membresia =
    membresiaParam === null || membresiaParam.trim() === ""
      ? "Básica"
      : membresiaParam.trim();

  // Saldo real de 0 no debe sobrescribirse
  const saldoParam = params.get("saldoPrendas");
  const saldoPrendas =
    saldoParam === null || saldoParam.trim() === "" ? 2 : Number(saldoParam);

  const sessionInfo = document.getElementById("session-info");

  if (sessionInfo) {
    sessionInfo.textContent = [
      `Usuario: ${usuario}`,
      `Rol: ${rol}`,
      `Idioma: ${idioma}`,
      `Conexión: ${online ? "En línea" : "Sin conexión"}`,
      `Sesión: ${sessionId}`,
      `Fecha: ${fechaActual}`,
      `Email: ${emailUsuario}@${emailDominio}`,
      `ID cliente: ${idCliente}`,
      `Apodo: ${apodo}`,
      `Membresía: ${membresia}`,
      `Prendas regalo: ${saldoPrendas}`,
    ].join(" · ");
  }

  /* =========================================================
BLOQUE 2: CATÁLOGO, OPERACIONES FINANCIERAS Y MONEDA
========================================================= */

  const catalogo = [
    { nombre: "Chaqueta Denim", precioTexto: "59.90€" },
    { nombre: "Camiseta Urban", precioTexto: "19.99€" },
    { nombre: "Pantalón Cargo", precioTexto: "49.50€" },
  ];

  function parsearPrecio(texto) {
    const limpio = String(texto)
      .replace(/[^0-9,.-]/g, "")
      .replace(",", ".");

    const numero = Number.parseFloat(limpio);

    return Number.isFinite(numero) ? numero : 0;
  }

  const subtotal = catalogo.reduce(
    (suma, item) => suma + parsearPrecio(item.precioTexto),
    0,
  );

  const subtotalSeguro =
    Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0;

  const cuponTexto = params.get("cupon") || "10";
  const descuento = parsearPrecio(cuponTexto);

  const baseImponible = Math.max(0, subtotalSeguro - descuento);
  const iva = baseImponible * 0.21;
  const total = baseImponible + iva;

  // Identificador secuencial del pedido
  let pedidoId = 1000;

  try {
    const guardado = window.localStorage.getItem("urbanStylePedidoId");
    const numeroGuardado = Number.parseInt(guardado, 10);

    if (Number.isFinite(numeroGuardado)) {
      pedidoId = numeroGuardado;
    }
  } catch (error) {
    console.error("No se pudo leer el pedido guardado:", error);
  }

  pedidoId += 1;

  try {
    window.localStorage.setItem("urbanStylePedidoId", String(pedidoId));
  } catch (error) {
    console.error("No se pudo guardar el pedido:", error);
  }

  const formatoEuro = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });

  const catalogList = document.getElementById("catalog-list");

  if (catalogList) {
    catalogo.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";

      const titulo = document.createElement("h3");
      titulo.textContent = item.nombre;

      const precio = document.createElement("p");
      precio.className = "price";
      precio.textContent = item.precioTexto;

      card.append(titulo, precio);
      catalogList.appendChild(card);
    });
  }

  const cartSummary = document.getElementById("cart-summary");

  if (cartSummary) {
    const dl = document.createElement("dl");
    dl.className = "cart-list";

    const filas = [
      { etiqueta: "Subtotal", valor: formatoEuro.format(subtotalSeguro) },
      { etiqueta: "Descuento", valor: `- ${formatoEuro.format(descuento)}` },
      { etiqueta: "Base imponible", valor: formatoEuro.format(baseImponible) },
      { etiqueta: "IVA (21%)", valor: formatoEuro.format(iva) },
      { etiqueta: "Total a pagar", valor: formatoEuro.format(total) },
      { etiqueta: "Nº de pedido", valor: String(pedidoId) },
    ];

    filas.forEach((fila) => {
      const dt = document.createElement("dt");
      dt.textContent = fila.etiqueta;

      const dd = document.createElement("dd");
      dd.textContent = fila.valor;

      dl.append(dt, dd);
    });

    cartSummary.appendChild(dl);
  }

  /* =========================================================
BLOQUE 3: OFERTA RELÁMPAGO CON TEMPORIZADOR
========================================================= */

  const flashBtn = document.getElementById("flash-btn");
  const flashCounter = document.getElementById("flash-counter");
  const flashMessage = document.getElementById("flash-message");

  let temporizador = null;
  let ofertaActiva = false;

  if (flashBtn && flashCounter && flashMessage) {
    flashBtn.addEventListener("click", () => {
      // Evita ejecuciones múltiples o temporizadores duplicados
      if (ofertaActiva) return;

      ofertaActiva = true;
      flashBtn.disabled = true;

      let segundos = 15;

      flashCounter.textContent = `${segundos} s`;
      flashMessage.textContent = "¡Oferta relámpago activada!";

      temporizador = window.setInterval(() => {
        segundos -= 1;
        flashCounter.textContent = `${segundos} s`;

        if (segundos <= 0) {
          window.clearInterval(temporizador);
          temporizador = null;
          ofertaActiva = false;
          flashBtn.disabled = false;

          flashCounter.textContent = "0 s";
          flashMessage.textContent = "La oferta ha expirado.";
        }
      }, 1000);
    });
  }

  /* =========================================================
BLOQUE 4: RESEÑAS, SEGURIDAD XSS Y PERSISTENCIA
========================================================= */

  const STORAGE_KEY = "urbanStyleReviews";

  const reviewForm = document.getElementById("review-form");
  const reviewText = document.getElementById("review-text");
  const reviewsList = document.getElementById("reviews-list");

  function cargarResenas() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) return [];

      const datos = JSON.parse(raw);

      return Array.isArray(datos) ? datos : [];
    } catch (error) {
      console.error("Error al leer las reseñas:", error);
      return [];
    }
  }

  function guardarResenas(resenas) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resenas));
    } catch (error) {
      console.error("Error al guardar las reseñas:", error);
    }
  }

  function renderizarResenas() {
    if (!reviewsList) return;

    reviewsList.textContent = "";

    const resenas = cargarResenas();

    if (resenas.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "empty";
      vacio.textContent = "Todavía no hay reseñas.";
      reviewsList.appendChild(vacio);
      return;
    }

    resenas.forEach((resena) => {
      const article = document.createElement("article");
      article.className = "review-card";

      const autor = document.createElement("h3");
      autor.textContent = resena.usuario || "Usuario";

      const meta = document.createElement("p");
      meta.className = "review-meta";
      meta.textContent = `ID: ${resena.id} · ${resena.hora}`;

      const comentario = document.createElement("p");
      comentario.className = "review-text";

      // textContent neutraliza XSS: todo se muestra como texto plano
      comentario.textContent = resena.comentario;

      article.append(autor, meta, comentario);
      reviewsList.appendChild(article);
    });
  }

  if (reviewForm && reviewText) {
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const comentario = reviewText.value.trim();

      if (!comentario) return;

      const nuevaResena = {
        id: Date.now(),
        usuario: usuario,
        hora: new Date().toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "medium",
        }),
        comentario: comentario,
      };

      const resenas = cargarResenas();
      resenas.unshift(nuevaResena);

      guardarResenas(resenas);
      renderizarResenas();
      reviewForm.reset();
    });
  }

  renderizarResenas();
});
