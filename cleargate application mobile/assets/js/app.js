/* ClearGate Mobile: hash-routed single-page app.
   Auth screens are static markup in index.html; signed-in screens are
   rendered here from DATA. No dependencies. */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* ---------------------------------------------------------------- Data */
  var DATA = {
    student: {
      name: "Ariel Tapnio",
      first: "Ariel",
      initials: "AT",
      year: "3rd Year",
      program: "BSCS",
      academicYear: "A.Y 2026 - 2027",
      role: "Student"
    },
    offices: [
      {
        id: "library", name: "Library", icon: "i-book", status: "action",
        task: "Return 1 unreturned book",
        detail: "1 unreturned book",
        text: "Library is waiting for the book to be returned before your account can be cleared.",
        next: "Return the book to the Library so the office can clear your account.",
        email: "library@example.edu", hours: "Mon to Fri · 8:00 AM to 5:00 PM"
      },
      {
        id: "accounting", name: "Accounting", icon: "i-wallet", status: "pending",
        task: "Review balance $20.00",
        detail: "Review balance $20.00",
        text: "Review your balance with Accounting to resolve the pending clearance.",
        next: "Review your balance with Accounting to resolve the pending clearance.",
        email: "accounting@example.edu", hours: "Mon to Fri · 8:00 AM to 4:00 PM"
      },
      {
        id: "registrar", name: "Registrar", icon: "i-file", status: "approved",
        task: "Records verified, form submitted",
        detail: "Records verified, form submitted",
        text: "Registrar has already cleared your account.",
        email: "registrar@example.edu", hours: "Mon to Fri · 8:00 AM to 5:00 PM"
      },
      {
        id: "guidance", name: "Guidance Office", icon: "i-heart", status: "approved",
        task: "No issues, cleared",
        detail: "No issues, cleared",
        text: "Guidance Office has already cleared your account.",
        email: "guidance@example.edu", hours: "Mon to Fri · 8:00 AM to 5:00 PM"
      },
      {
        id: "dean", name: "Dean's Office", icon: "i-cap", status: "approved",
        task: "Academic stand okay",
        detail: "Academic stand okay",
        text: "Dean's Office has already cleared your account.",
        email: "dean@example.edu", hours: "Mon to Fri · 9:00 AM to 4:00 PM"
      },
      {
        id: "property", name: "Property Custodian", icon: "i-box", status: "approved",
        task: "No liabilities",
        detail: "No liabilities",
        text: "Property Custodian has already cleared your account.",
        email: "property@example.edu", hours: "Mon to Fri · 8:00 AM to 5:00 PM"
      }
    ],
    notifications: [
      { icon: "i-book", tone: "action", title: "Library needs action", text: "1 unreturned book is holding your clearance.", unread: true },
      { icon: "i-wallet", tone: "pending", title: "Accounting is reviewing", text: "Review your balance of $20.00 to finish clearance.", unread: true },
      { icon: "i-check-circle", tone: "approved", title: "Registrar cleared you", text: "Records verified, form submitted.", unread: false }
    ]
  };

  var STATUS = {
    action:   { label: "Needs action", badge: "badge--action",   tile: "tile--action",   order: 0 },
    pending:  { label: "Pending",      badge: "badge--pending",  tile: "tile--pending",  order: 1 },
    approved: { label: "Approved",     badge: "badge--approved", tile: "tile--approved", order: 2 }
  };

  var offices = DATA.offices.slice().sort(function (a, b) {
    return STATUS[a.status].order - STATUS[b.status].order;
  });
  var total = offices.length;
  var cleared = offices.filter(function (o) { return o.status === "approved"; }).length;
  var outstanding = offices.filter(function (o) { return o.status !== "approved"; });
  var pendingCount = offices.filter(function (o) { return o.status === "pending"; }).length;
  var actionCount = offices.filter(function (o) { return o.status === "action"; }).length;
  var percent = Math.round((cleared / total) * 100);

  /* ------------------------------------------------------------ Helpers */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function icon(id, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  function badge(status) {
    return '<span class="badge ' + STATUS[status].badge + '">' + STATUS[status].label + "</span>";
  }

  function findOffice(id) {
    for (var i = 0; i < offices.length; i++) if (offices[i].id === id) return offices[i];
    return null;
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Storage can throw in private mode or when site data is blocked. */
  var store = {
    get: function (area, key) {
      try { return window[area].getItem(key); } catch (e) { return null; }
    },
    set: function (area, key, value) {
      try { window[area].setItem(key, value); } catch (e) { /* ignore */ }
    },
    remove: function (area, key) {
      try { window[area].removeItem(key); } catch (e) { /* ignore */ }
    }
  };

  var SESSION_KEY = "cleargate.session";
  var memorySession = false; // fallback when storage is unavailable

  function isSignedIn() {
    return memorySession || store.get("localStorage", SESSION_KEY) === "1" || store.get("sessionStorage", SESSION_KEY) === "1";
  }

  function signIn(remember) {
    memorySession = true;
    store.set(remember ? "localStorage" : "sessionStorage", SESSION_KEY, "1");
  }

  function signOut() {
    memorySession = false;
    store.remove("localStorage", SESSION_KEY);
    store.remove("sessionStorage", SESSION_KEY);
  }

  /* -------------------------------------------------------------- Toast */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }

  /* -------------------------------------------------------- Screens */
  function progressRing() {
    var r = 44;
    var c = 2 * Math.PI * r;
    var offset = c * (1 - cleared / total);
    return (
      '<div class="ring" role="img" aria-label="' + cleared + " of " + total + ' offices cleared">' +
        '<svg viewBox="0 0 104 104" aria-hidden="true">' +
          '<circle class="ring__track" cx="52" cy="52" r="' + r + '"/>' +
          '<circle class="ring__value" cx="52" cy="52" r="' + r + '" stroke-dasharray="' + c.toFixed(2) +
            '" stroke-dashoffset="' + (reduceMotion ? offset.toFixed(2) : c.toFixed(2)) + '" data-offset="' + offset.toFixed(2) + '"/>' +
        "</svg>" +
        '<span class="ring__label" aria-hidden="true"><span class="ring__num">' + percent + '%</span><span class="ring__cap">done</span></span>' +
      "</div>"
    );
  }

  function officeListItem(o) {
    return (
      "<li>" +
        '<button class="list-item' + (o.status === "action" ? " list-item--attention" : "") + '" type="button" data-office="' + o.id + '">' +
          '<span class="tile ' + STATUS[o.status].tile + '">' + icon(o.icon) + "</span>" +
          '<span class="list-item__body">' +
            '<span class="list-item__top"><span class="list-item__title">' + esc(o.name) + "</span>" + badge(o.status) + "</span>" +
            '<span class="list-item__text">' + esc(o.task) + "</span>" +
          "</span>" +
          icon("i-chevron", "list-item__chevron") +
          '<span class="visually-hidden">, view details</span>' +
        "</button>" +
      "</li>"
    );
  }

  function pageHead(title, pill) {
    var s = DATA.student;
    return (
      '<header class="page-head">' +
        (pill ? '<span class="pill">' + esc(pill) + "</span>" : "") +
        '<h1 class="page-title" tabindex="-1">' + esc(title) + "</h1>" +
        '<p class="page-subtitle">' + esc(s.name + " · " + s.year + " " + s.program + " · " + s.academicYear) + "</p>" +
      "</header>"
    );
  }

  function eligibilityCard() {
    var eligible = cleared === total;
    return (
      '<section class="card eligibility" aria-labelledby="elig-title">' +
        '<p class="eligibility__eyebrow">' + icon("i-sparkle", "icon--sm") + "Enrollment eligibility</p>" +
        '<h2 class="eligibility__title" id="elig-title">' + (eligible ? "Eligible to enroll" : "Not yet eligible") + "</h2>" +
        '<p class="eligibility__text">' +
          (eligible
            ? "All offices have cleared you. You can enroll next semester."
            : "You can enroll next semester only once all " + total + " offices have cleared you.") +
        "</p>" +
      "</section>"
    );
  }

  var screens = {
    home: function () {
      var s = DATA.student;
      var first = outstanding[0];
      var hour = new Date().getHours();
      var greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

      var tiles = offices.map(function (o) {
        return (
          "<li>" +
            '<button class="card office-tile" type="button" data-office="' + o.id + '">' +
              '<span class="tile ' + STATUS[o.status].tile + '">' + icon(o.icon) + "</span>" +
              '<span class="office-tile__name">' + esc(o.name) + "</span>" +
              '<span class="office-tile__detail">' + esc(o.detail) + "</span>" +
              badge(o.status) +
            "</button>" +
          "</li>"
        );
      }).join("");

      return (
        '<header class="page-head">' +
          '<span class="pill">' + esc(s.academicYear) + "</span>" +
          '<h1 class="page-title page-title--light" tabindex="-1">' + greet + ", " + esc(s.first) + "</h1>" +
          '<p class="page-subtitle">' + esc(s.year + " " + s.program) + " · Here's where your clearance stands.</p>" +
        "</header>" +

        '<section class="card overall" aria-labelledby="overall-title">' +
          "<div>" +
            '<p class="card__eyebrow" id="overall-title">Overall Progress</p>' +
            '<p class="overall__value">' + cleared + " of " + total + "<br>offices cleared</p>" +
            '<p class="overall__meta">' + outstanding.length + " still outstanding</p>" +
          "</div>" +
          progressRing() +
        "</section>" +

        (first
          ? '<section class="card alert" aria-labelledby="alert-title">' +
              '<div class="card__head">' +
                '<h2 class="alert__title" id="alert-title"><span class="alert-dot">' + icon("i-alert", "icon--sm") + "</span>Action needed</h2>" +
                badge(first.status) +
              "</div>" +
              "<div>" +
                '<p class="card__title">' + esc(first.name) + "</p>" +
                '<p class="alert__text">' + esc(first.text) + "</p>" +
              "</div>" +
              '<div class="btn-row">' +
                '<button class="btn btn--primary" type="button" data-office="' + first.id + '">View details</button>' +
                '<button class="btn btn--outline" type="button" data-office="' + first.id + '" data-focus="contact">Contact office</button>' +
              "</div>" +
            "</section>"
          : "") +

        '<section class="section" aria-labelledby="offices-title">' +
          '<div class="section-head">' +
            '<h2 class="section-title" id="offices-title">Office Status</h2>' +
            '<a class="section-link" href="#status">See all</a>' +
          "</div>" +
          '<ul class="office-grid" role="list">' + tiles + "</ul>" +
        "</section>"
      );
    },

    requirements: function () {
      var counts = { all: total, todo: outstanding.length, cleared: cleared };
      var chips = [["all", "All"], ["todo", "To do"], ["cleared", "Cleared"]].map(function (c) {
        return (
          '<button class="chip" type="button" data-filter="' + c[0] + '" aria-pressed="' + (reqFilter === c[0]) + '">' +
            c[1] + '<span class="chip__count">' + counts[c[0]] + "</span>" +
          "</button>"
        );
      }).join("");

      return (
        pageHead("My Requirements", outstanding.length + " tasks remaining") +

        '<section class="card snapshot" aria-labelledby="snap-title">' +
          '<div class="snapshot__row">' +
            '<h2 class="card__eyebrow" id="snap-title">Completion Snapshot</h2>' +
            '<span class="snapshot__value">' + cleared + " of " + total + "</span>" +
          "</div>" +
          '<div class="progress" role="progressbar" aria-labelledby="snap-title" aria-valuemin="0" aria-valuemax="' + total +
            '" aria-valuenow="' + cleared + '" aria-valuetext="' + cleared + " of " + total + ' offices cleared">' +
            '<div class="progress__bar" style="--value:' + ((cleared / total) * 100).toFixed(2) + '%"></div>' +
          "</div>" +
          '<p class="card__text">Focus on the tasks you still need to finish before enrollment opens.</p>' +
        "</section>" +

        '<section class="section" aria-labelledby="check-title">' +
          '<div class="section-head"><h2 class="section-title" id="check-title">Requirement checklist</h2></div>' +
          '<div class="chips" role="group" aria-label="Filter requirements">' + chips + "</div>" +
          '<div class="card card--flush"><ul class="list" role="list" data-req-list>' + requirementItems() + "</ul></div>" +
        "</section>" +

        '<div class="note">' +
          '<p class="note__title">Future eligibility</p>' +
          '<p class="note__text">Once fully cleared, you can enroll next semester.</p>' +
        "</div>"
      );
    },

    status: function () {
      var steps = outstanding.map(function (o, i) {
        return (
          '<li class="card step-card">' +
            '<p class="step-card__meta"><span>Step ' + (i + 1) + " · " + esc(o.name) + "</span>" + badge(o.status) + "</p>" +
            '<h3 class="step-card__title">' + esc(o.task) + "</h3>" +
            '<p class="step-card__text">' + esc(o.next) + "</p>" +
            '<button class="btn btn--outline btn--block btn--split" type="button" data-office="' + o.id + '">' +
              "View " + esc(o.name) + " details" + icon("i-arrow-right", "icon--sm") +
            "</button>" +
          "</li>"
        );
      }).join("");

      return (
        pageHead("Clearance Status") +

        '<section class="card summary" aria-labelledby="sum-title">' +
          '<div class="summary__main">' +
            '<span class="tile tile--indigo tile--lg">' + icon("i-activity", "icon--lg") + "</span>" +
            "<div>" +
              '<h2 class="summary__title" id="sum-title">' + cleared + " of " + total + " offices approved</h2>" +
              '<p class="card__text">' + (outstanding.length === 0 ? "Every office has cleared your account." :
                (outstanding.length === 1 ? "One office still needs" : outstanding.length === 2 ? "Two offices still need" : outstanding.length + " offices still need") +
                " to clear your account.") + "</p>" +
            "</div>" +
          "</div>" +
          '<ul class="stats" role="list">' +
            '<li><p class="stats__num stats__num--approved">' + cleared + '</p><p class="stats__label">Approved</p></li>' +
            '<li><p class="stats__num stats__num--pending">' + pendingCount + '</p><p class="stats__label">Pending</p></li>' +
            '<li><p class="stats__num stats__num--action">' + actionCount + '</p><p class="stats__label">Needs action</p></li>' +
          "</ul>" +
        "</section>" +

        (steps
          ? '<section class="section" aria-labelledby="steps-title">' +
              '<div class="section-head"><h2 class="section-title" id="steps-title">Your next steps</h2></div>' +
              '<ol class="section" role="list">' + steps + "</ol>" +
            "</section>"
          : "") +

        '<section class="section" aria-labelledby="all-title">' +
          '<div class="section-head">' +
            '<h2 class="section-title" id="all-title">All offices</h2>' +
            '<a class="section-link" href="#requirements">Requirements</a>' +
          "</div>" +
          '<div class="card card--flush"><ul class="list" role="list">' + offices.map(officeListItem).join("") + "</ul></div>" +
        "</section>" +

        eligibilityCard()
      );
    },

    profile: function () {
      var s = DATA.student;
      var reminders = store.get("localStorage", "cleargate.reminders") !== "0";
      var standalone = isStandalone();
      var installRow;

      if (standalone) {
        installRow = settingsRow("i-check-circle", "ClearGate is installed", "You're using the app version.", "", true);
      } else if (deferredInstall) {
        installRow = settingsRow("i-download", "Install ClearGate", "Add the app to your home screen.", 'data-install');
      } else if (isIOS()) {
        installRow = settingsRow("i-download", "Add to Home Screen", "In Safari, tap Share, then Add to Home Screen.", 'data-install-help="ios"');
      } else {
        installRow = settingsRow("i-download", "Install ClearGate", "Use your browser menu: Install app or Add to Home screen.", 'data-install-help="menu"');
      }

      return (
        '<section class="profile" aria-labelledby="profile-title">' +
          '<span class="avatar avatar--xl" aria-hidden="true">' + esc(s.initials) + "</span>" +
          '<h1 class="profile__name" id="profile-title" tabindex="-1">' + esc(s.name) + "</h1>" +
          '<p class="profile__meta">' + esc(s.role + " · " + s.year + " " + s.program) + "</p>" +
        "</section>" +

        '<section class="card card--flush" aria-label="Student details">' +
          '<dl class="details">' +
            detailRow("Program", s.program) +
            detailRow("Year level", s.year) +
            detailRow("Academic year", s.academicYear.replace(/^A\.Y\s*/, "")) +
            detailRow("Clearance", cleared + " of " + total + " offices") +
          "</dl>" +
        "</section>" +

        '<section class="card card--flush" aria-label="Settings">' +
          '<ul class="settings" role="list">' +
            "<li>" +
              '<label class="settings-row">' +
                '<span class="tile tile--indigo">' + icon("i-bell") + "</span>" +
                '<span class="settings-row__body">Clearance reminders<span class="settings-row__hint">Get a nudge when an office updates.</span></span>' +
                '<input class="switch" type="checkbox" role="switch" data-reminders' + (reminders ? " checked" : "") + ">" +
              "</label>" +
            "</li>" +
            "<li>" + installRow + "</li>" +
            "<li>" +
              '<button class="settings-row settings-row--danger" type="button" data-logout>' +
                '<span class="tile tile--action">' + icon("i-logout") + "</span>" +
                '<span class="settings-row__body">Log out</span>' +
              "</button>" +
            "</li>" +
          "</ul>" +
        "</section>" +

        '<p class="app-version">ClearGate · Student Clearance Portal · v1.0</p>'
      );
    }
  };

  function detailRow(label, value) {
    return '<div class="details__row"><dt>' + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function settingsRow(iconId, title, hint, attrs, plain) {
    var inner =
      '<span class="tile tile--indigo">' + icon(iconId) + "</span>" +
      '<span class="settings-row__body">' + esc(title) + '<span class="settings-row__hint">' + esc(hint) + "</span></span>";
    return plain
      ? '<div class="settings-row">' + inner + "</div>"
      : '<button class="settings-row" type="button" ' + attrs + ">" + inner + icon("i-chevron", "list-item__chevron") + "</button>";
  }

  var reqFilter = "all";
  function requirementItems() {
    var list = offices.filter(function (o) {
      if (reqFilter === "todo") return o.status !== "approved";
      if (reqFilter === "cleared") return o.status === "approved";
      return true;
    });
    if (!list.length) {
      return '<li class="empty">' + (reqFilter === "todo" ? "Nothing left to do. You're fully cleared!" : "No offices have cleared you yet.") + "</li>";
    }
    return list.map(officeListItem).join("");
  }

  /* --------------------------------------------------------- Bottom sheet */
  var sheet = $("#sheet");
  var sheetTitle = $("#sheet-title");
  var sheetBody = $("#sheet-body");
  var sheetHasHistory = false;
  var sheetReturnFocus = null;
  var pendingHash = null;
  var supportsDialog = typeof sheet.showModal === "function";

  function openSheet(title, html, focusSel) {
    sheetTitle.textContent = title;
    sheetBody.innerHTML = html;
    sheetReturnFocus = document.activeElement;
    sheetBody.scrollTop = 0;

    if (supportsDialog) {
      sheet.showModal();
    } else {
      sheet.setAttribute("open", "");
    }

    try {
      history.pushState({ sheet: true }, "");
      sheetHasHistory = true;
    } catch (e) {
      sheetHasHistory = false;
    }

    var target = focusSel && $(focusSel, sheetBody);
    (target || $("[data-sheet-close]", sheet)).focus();
  }

  function closeSheet() {
    if (!sheet.open) return;
    if (supportsDialog) sheet.close();
    else { sheet.removeAttribute("open"); onSheetClosed(); }
  }

  function onSheetClosed() {
    if (sheetHasHistory) {
      sheetHasHistory = false;
      history.back(); // drop the entry we pushed; popstate then runs any pending navigation
    } else if (pendingHash) {
      var h = pendingHash;
      pendingHash = null;
      location.hash = h;
    }
    if (sheetReturnFocus && document.contains(sheetReturnFocus)) sheetReturnFocus.focus();
    sheetReturnFocus = null;
  }

  sheet.addEventListener("close", onSheetClosed);

  // Tap on the dimmed backdrop closes the sheet
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet) closeSheet();
  });

  window.addEventListener("popstate", function () {
    if (sheet.open) {
      // Hardware/browser Back while the sheet is up: close it, don't navigate.
      sheetHasHistory = false;
      closeSheet();
    }
    if (pendingHash) {
      var h = pendingHash;
      pendingHash = null;
      location.hash = h;
    }
  });

  function officeSheet(id, focus) {
    var o = findOffice(id);
    if (!o) return;
    var done = o.status === "approved";
    var html =
      '<div class="card__head" style="align-items:center">' +
        '<span class="tile tile--lg ' + STATUS[o.status].tile + '">' + icon(o.icon, "icon--lg") + "</span>" +
        '<div style="flex:1;min-width:0"><p class="sheet__label">Status</p><p class="sheet__value">' + badge(o.status) + "</p></div>" +
      "</div>" +
      "<div>" +
        '<p class="sheet__label">' + (done ? "Clearance note" : "Requirement") + "</p>" +
        '<p class="sheet__value sheet__value--lead">' + esc(o.task) + "</p>" +
      "</div>" +
      "<div>" +
        '<p class="sheet__label">' + (done ? "Details" : "Next step") + "</p>" +
        '<p class="sheet__value">' + esc(done ? o.text : o.next) + "</p>" +
      "</div>" +
      "<div>" +
        '<p class="sheet__label" id="contact-label">Contact office</p>' +
        '<div class="contact" style="margin-top:6px">' +
          '<span class="tile tile--indigo">' + icon("i-mail") + "</span>" +
          '<span class="contact__body">' +
            '<span class="contact__email" data-email>' + esc(o.email) + "</span>" +
            '<span class="contact__hours">' + esc(o.hours) + "</span>" +
          "</span>" +
          '<button class="copy-btn" type="button" data-copy="' + esc(o.email) + '" aria-label="Copy ' + esc(o.name) + ' email address">Copy</button>' +
        "</div>" +
      "</div>" +
      (done
        ? ""
        : '<a class="btn btn--primary btn--block" href="#requirements" data-sheet-nav>Open my requirements</a>');

    openSheet(o.name, html, focus === "contact" ? "[data-copy]" : null);
  }

  function notificationsSheet() {
    var html = '<ul class="section" role="list" style="gap:16px">' +
      DATA.notifications.map(function (n) {
        return (
          '<li class="notif">' +
            '<span class="tile ' + STATUS[n.tone].tile + '">' + icon(n.icon) + "</span>" +
            "<div>" +
              '<p class="notif__title">' + esc(n.title) + (n.unread ? ' <span class="badge badge--indigo">New</span>' : "") + "</p>" +
              '<p class="notif__text">' + esc(n.text) + "</p>" +
            "</div>" +
          "</li>"
        );
      }).join("") +
    "</ul>";

    openSheet("Notifications", html);

    DATA.notifications.forEach(function (n) { n.unread = false; });
    store.set("localStorage", "cleargate.notificationsRead", "1");
    syncUnread();
  }

  function syncUnread() {
    var unread = DATA.notifications.filter(function (n) { return n.unread; }).length;
    var btn = $("[data-open-notifications]");
    $(".icon-btn__dot", btn).hidden = unread === 0;
    btn.setAttribute("aria-label", unread ? "Notifications, " + unread + " unread" : "Notifications");
  }

  /* -------------------------------------------------------------- Copy */
  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      (sheet.open ? sheet : document.body).appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return Promise.resolve(fallback());
  }

  /* ------------------------------------------------------------- Router */
  var AUTH_ROUTES = ["login", "forgot", "reset", "done"];
  var APP_ROUTES = ["home", "requirements", "status", "profile"];
  var appEl = $("#app");
  var shell = $("[data-shell]");
  var content = $("#content");
  var firstRender = true;

  function currentRoute() {
    return location.hash.replace(/^#/, "");
  }

  function go(route, replace) {
    if (replace) {
      try { history.replaceState(null, "", "#" + route); } catch (e) { location.hash = route; return; }
      render();
    } else {
      location.hash = route;
    }
  }

  function render() {
    var route = currentRoute();
    var signedIn = isSignedIn();

    if (APP_ROUTES.indexOf(route) === -1 && AUTH_ROUTES.indexOf(route) === -1) {
      return go(signedIn ? "home" : "login", true);
    }
    if (APP_ROUTES.indexOf(route) !== -1 && !signedIn) return go("login", true);
    if (route === "login" && signedIn) return go("home", true);

    if (sheet.open) { sheetHasHistory = false; closeSheet(); }

    var isApp = APP_ROUTES.indexOf(route) !== -1;
    appEl.classList.toggle("app--auth", !isApp);

    $$("[data-screen]").forEach(function (el) {
      el.hidden = el.getAttribute("data-screen") !== route;
    });

    var heading;
    if (isApp) {
      shell.hidden = false;
      content.innerHTML = '<div class="screen" data-route="' + route + '">' + screens[route]() + "</div>";
      $$("[data-tab]").forEach(function (tab) {
        if (tab.getAttribute("data-tab") === route) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
      });
      heading = $("h1", content);
      animateRing();
      document.title = titleFor(route) + " · ClearGate";
    } else {
      shell.hidden = true;
      content.innerHTML = "";
      var screen = $('[data-screen="' + route + '"]');
      // Replay the entrance animation
      screen.classList.remove("screen");
      void screen.offsetWidth;
      screen.classList.add("screen");
      heading = $("h1", screen);
      document.title = "ClearGate";
    }

    window.scrollTo(0, 0);
    if (heading && !firstRender) heading.focus({ preventScroll: true });
    firstRender = false;
  }

  function titleFor(route) {
    return { home: "Home", requirements: "My Requirements", status: "Clearance Status", profile: "Profile" }[route];
  }

  function animateRing() {
    var ring = $(".ring__value", content);
    if (!ring || reduceMotion) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ring.style.strokeDashoffset = ring.getAttribute("data-offset");
      });
    });
  }

  window.addEventListener("hashchange", render);

  /* ------------------------------------------------------------- Forms */
  function showError(form, message, field) {
    var el = $("[data-error]", form);
    $$("[aria-invalid]", form).forEach(function (i) { i.removeAttribute("aria-invalid"); });
    if (!message) { el.hidden = true; el.textContent = ""; return; }
    el.textContent = message;
    el.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  var handlers = {
    login: function (form) {
      var id = form.elements.username;
      var pw = form.elements.password;
      if (!id.value.trim()) return showError(form, "Enter your student ID or email.", id);
      if (!pw.value) return showError(form, "Enter your password.", pw);
      showError(form, "");
      signIn(form.elements.remember.checked);
      pw.value = "";
      go("home");
      toast("Welcome back, " + DATA.student.first + "!");
    },
    forgot: function (form) {
      var email = form.elements.email;
      if (!email.value.trim() || !email.checkValidity()) return showError(form, "Enter a valid email address.", email);
      showError(form, "");
      toast("Reset link sent. Check your email.");
      go("reset");
    },
    reset: function (form) {
      var pw = form.elements["new-password"];
      var confirm = form.elements["confirm-password"];
      if (pw.value.length < 8) return showError(form, "Your new password needs at least 8 characters.", pw);
      if (pw.value !== confirm.value) return showError(form, "Passwords don't match.", confirm);
      showError(form, "");
      form.reset();
      go("done");
    }
  };

  $$("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handlers[form.getAttribute("data-form")](form);
    });
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid")) showError(form, "");
    });
  });

  /* ---------------------------------------------------- Install (PWA) */
  var deferredInstall = null;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    if (currentRoute() === "profile") render();
  });

  window.addEventListener("appinstalled", function () {
    deferredInstall = null;
    toast("ClearGate was added to your home screen.");
    if (currentRoute() === "profile") render();
  });

  /* ------------------------------------------------------ Event wiring */
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;

    var toggle = t.closest("[data-password-toggle]");
    if (toggle) {
      var input = document.getElementById(toggle.getAttribute("data-password-toggle"));
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      return;
    }

    var officeBtn = t.closest("[data-office]");
    if (officeBtn) {
      officeSheet(officeBtn.getAttribute("data-office"), officeBtn.getAttribute("data-focus"));
      return;
    }

    if (t.closest("[data-open-notifications]")) { notificationsSheet(); return; }
    if (t.closest("[data-sheet-close]")) { closeSheet(); return; }

    var sheetNav = t.closest("[data-sheet-nav]");
    if (sheetNav) {
      e.preventDefault();
      pendingHash = sheetNav.getAttribute("href").replace(/^#/, "");
      closeSheet();
      return;
    }

    var copy = t.closest("[data-copy]");
    if (copy) {
      copyText(copy.getAttribute("data-copy")).then(function (ok) {
        if (ok) {
          copy.textContent = "Copied";
          setTimeout(function () { copy.textContent = "Copy"; }, 1800);
          toast("Email address copied");
        } else {
          var range = document.createRange();
          range.selectNodeContents($("[data-email]", sheetBody));
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          toast("Press and hold to copy the address");
        }
      });
      return;
    }

    var chip = t.closest("[data-filter]");
    if (chip) {
      reqFilter = chip.getAttribute("data-filter");
      $$("[data-filter]", content).forEach(function (c) {
        c.setAttribute("aria-pressed", String(c === chip));
      });
      $("[data-req-list]", content).innerHTML = requirementItems();
      return;
    }

    if (t.closest("[data-install]") && deferredInstall) {
      var prompt = deferredInstall;
      deferredInstall = null;
      prompt.prompt();
      prompt.userChoice.then(function () { render(); }, function () { render(); });
      return;
    }

    var help = t.closest("[data-install-help]");
    if (help) {
      toast(help.getAttribute("data-install-help") === "ios"
        ? "Tap the Share icon, then Add to Home Screen."
        : "Open your browser menu and choose Install app.");
      return;
    }

    if (t.closest("[data-logout]")) {
      signOut();
      go("login");
      toast("You've been logged out.");
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches("[data-reminders]")) {
      store.set("localStorage", "cleargate.reminders", e.target.checked ? "1" : "0");
      toast(e.target.checked ? "Reminders on" : "Reminders off");
    }
  });

  // Re-tapping the active tab scrolls back to the top
  $$("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function (e) {
      if (tab.getAttribute("aria-current") === "page") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });

  /* ------------------------------------------------------------- Start */
  if (store.get("localStorage", "cleargate.notificationsRead") === "1") {
    DATA.notifications.forEach(function (n) { n.unread = false; });
  }
  syncUnread();
  $("[data-todo-count]").textContent = outstanding.length;
  $("[data-todo-count]").hidden = outstanding.length === 0;

  render();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline support unavailable here */ });
    });
  }
})();
