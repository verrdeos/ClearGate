/* ClearGate — progressive enhancement. Every page works without this file. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  /* ---------- Off-canvas sidebar (< 1024px) ---------- */
  var body = document.body;
  var sidebar = document.getElementById("sidebar");
  var toggle = document.querySelector("[data-nav-toggle]");
  var closers = document.querySelectorAll("[data-nav-close]");
  var desktop = window.matchMedia("(min-width: 1024px)");

  function setNav(open) {
    if (!sidebar || !toggle) return;
    body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      var first = sidebar.querySelector("[data-nav-close], a, button");
      if (first) first.focus();
    }
  }

  if (sidebar && toggle) {
    toggle.addEventListener("click", function () {
      setNav(!body.classList.contains("nav-open"));
    });

    closers.forEach(function (el) {
      el.addEventListener("click", function () {
        setNav(false);
        toggle.focus();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("nav-open")) {
        setNav(false);
        toggle.focus();
      }
    });

    var onChange = function (e) {
      if (e.matches) setNav(false);
    };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else desktop.addListener(onChange);
  }

  /* ---------- User menu: close on outside click / Escape ---------- */
  document.querySelectorAll(".user-menu").forEach(function (menu) {
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  });

  /* ---------- Show / hide password ---------- */
  document.querySelectorAll("[data-password-toggle]").forEach(function (btn) {
    var input = document.getElementById(btn.getAttribute("aria-controls"));
    if (!input) return;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  /* ---------- Confirm-password matching ---------- */
  document.querySelectorAll("[data-match]").forEach(function (input) {
    var other = document.getElementById(input.getAttribute("data-match"));
    if (!other) return;
    var check = function () {
      input.setCustomValidity(
        input.value && input.value !== other.value ? "Passwords do not match." : ""
      );
    };
    input.addEventListener("input", check);
    other.addEventListener("input", check);
  });

  /* ---------- Prototype navigation ----------
     Forms marked with data-demo-redirect move to the next screen after native
     validation passes. Remove the attribute once the form posts to a real
     backend endpoint (set via the form's action/method). */
  document.querySelectorAll("form[data-demo-redirect]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      window.location.href = form.getAttribute("data-demo-redirect");
    });
  });
})();

/* Hosted demo additions: copy office email, keep search on the requirements page. */
(function () {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-copy-email]");
    if (!btn) return;
    var email = btn.getAttribute("data-copy-email");
    var label = btn.lastChild;
    function done(ok) {
      label.textContent = ok ? " Copied " + email : " " + email;
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });
  document.querySelectorAll("form.search").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "requirements.html";
    });
  });
})();
