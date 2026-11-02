/* ==========================================================================
   Thorne & Co. Plumbing Services
   script.js - WEDE5020 Part 3 (JavaScript functionality + validation)

   Sections:
     1. Helpers (validation + safe text)
     2. Mobile navigation
     3. Contact form -> compiled email (contact.html)
     4. Enquiry form -> cost + availability (enquiry.html)
     5. Services search + sort + accordion (services.html)
     6. Dynamic reviews (index.html)
     7. Gallery lightbox (gallery.html)
     8. Leaflet map (contact.html)
     9. Scroll animations
   ========================================================================== */

/* ---------- 1. HELPERS ---------- */

// Show or clear an error under a field. Returns true if the field is OK.
function validateField(field, condition, errorText) {
  var errorEl = document.getElementById(field.id + "Error");
  if (condition) {
    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");
    if (errorEl) { errorEl.classList.remove("show"); }
    return true;
  }
  field.classList.add("invalid");
  field.setAttribute("aria-invalid", "true");
  if (errorEl) {
    errorEl.textContent = errorText;
    errorEl.classList.add("show");
  }
  return false;
}

// Strip spaces/dashes/brackets so 082 123 4567 and 082-123-4567 both work
function cleanPhone(value) {
  return value.replace(/[\s\-()]/g, "");
}

// South African numbers: 0821234567 or +27821234567 (9 digits after the 0 / +27)
function isValidSAPhone(value) {
  return /^(\+27|0)[1-9][0-9]{8}$/.test(cleanPhone(value));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// Names: letters, spaces, hyphens and apostrophes only
function isValidName(value) {
  return /^[A-Za-z\u00C0-\u017F' -]{2,60}$/.test(value.trim());
}

// Security: never put user text into innerHTML. textContent escapes it for us.
function setText(el, text) {
  el.textContent = text;
}

function formatRand(n) {
  return "R" + n.toLocaleString("en-ZA").replace(/\u00A0/g, " ");
}

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- 2. MOBILE NAVIGATION ---------- */
  var toggleBtn = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- 3. CONTACT FORM -> COMPILED EMAIL ---------- */
  var contactForm = document.getElementById("enquiryForm");
  if (contactForm) {
    var RECIPIENT = "info@thorneandcoplumbing.co.za";

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = document.getElementById("fullName");
      var phone = document.getElementById("phone");
      var email = document.getElementById("email");
      var type = document.getElementById("serviceType");
      var message = document.getElementById("message");

      var ok = true;
      ok = validateField(name, isValidName(name.value), "Please enter your full name (letters only, at least 2 characters).") && ok;
      ok = validateField(phone, isValidSAPhone(phone.value), "Enter a valid SA number, e.g. 082 123 4567 or +27 82 123 4567.") && ok;
      ok = validateField(email, isValidEmail(email.value), "Please enter a valid email address.") && ok;
      ok = validateField(type, type.value !== "", "Please choose a message type.") && ok;
      ok = validateField(message, message.value.trim().length >= 10 && message.value.trim().length <= 600, "Message must be between 10 and 600 characters.") && ok;

      var preview = document.getElementById("emailPreview");

      if (!ok) {
        preview.hidden = true;
        return;
      }

      // Compile the email
      var subject = type.value + " - " + name.value.trim();
      var body =
        "Hello Thorne & Co.,\n\n" +
        message.value.trim() + "\n\n" +
        "---\n" +
        "Name: " + name.value.trim() + "\n" +
        "Phone: " + cleanPhone(phone.value) + "\n" +
        "Email: " + email.value.trim() + "\n" +
        "Message type: " + type.value;

      setText(document.getElementById("prevTo"), RECIPIENT);
      setText(document.getElementById("prevSubject"), subject);
      setText(document.getElementById("prevBody"), body);

      // encodeURIComponent keeps special characters from breaking the link
      var mailto = "mailto:" + RECIPIENT +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      document.getElementById("sendEmailBtn").setAttribute("href", mailto);

      preview.hidden = false;
      preview.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ---------- 4. ENQUIRY FORM -> COST + AVAILABILITY ---------- */
  var quoteForm = document.getElementById("quoteForm");
  if (quoteForm) {
    var dateInput = document.getElementById("qDate");

    // Date can't be in the past
    var today = new Date();
    var todayStr = today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
    dateInput.setAttribute("min", todayStr);

    // Sample price list (rand). Low / high base range per job.
    var PRICES = {
      "geyser-repair":  { label: "Geyser repair",                    low: 850,  high: 1800 },
      "geyser-replace": { label: "Geyser replacement",               low: 6500, high: 12000 },
      "leak":           { label: "Leak detection",                   low: 650,  high: 1500 },
      "drain":          { label: "Drain unblocking",                 low: 550,  high: 1200 },
      "install":        { label: "Tap / toilet / basin installation", low: 750,  high: 1500 },
      "other":          { label: "Call-out and assessment",          low: 450,  high: 450 }
    };

    quoteForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = document.getElementById("qName");
      var email = document.getElementById("qEmail");
      var phone = document.getElementById("qPhone");
      var service = document.getElementById("qService");
      var property = document.getElementById("qProperty");
      var qty = document.getElementById("qQty");
      var date = document.getElementById("qDate");
      var urgency = quoteForm.querySelector('input[name="urgency"]:checked').value;

      var qtyNum = parseInt(qty.value, 10);
      var chosen = date.value ? new Date(date.value + "T00:00:00") : null;
      var dateOk = chosen !== null && date.value >= todayStr;

      var ok = true;
      ok = validateField(name, isValidName(name.value), "Please enter your full name (letters only).") && ok;
      ok = validateField(email, isValidEmail(email.value), "Please enter a valid email address.") && ok;
      ok = validateField(phone, isValidSAPhone(phone.value), "Enter a valid SA number, e.g. 082 123 4567.") && ok;
      ok = validateField(service, service.value !== "", "Please select a service.") && ok;
      ok = validateField(property, property.value !== "", "Please select a property type.") && ok;
      ok = validateField(qty, !isNaN(qtyNum) && qtyNum >= 1 && qtyNum <= 10, "Enter a number between 1 and 10.") && ok;
      ok = validateField(date, dateOk, "Please choose today's date or a future date.") && ok;

      var output = document.getElementById("quoteOutput");
      var placeholder = document.getElementById("quotePlaceholder");

      if (!ok) {
        output.hidden = true;
        placeholder.hidden = false;
        return;
      }

      // ---- cost calculation ----
      var item = PRICES[service.value];
      var low = item.low;
      var high = item.high;

      // extra fixtures add 40% of the base each (not for geyser replacement)
      if (service.value !== "geyser-replace" && service.value !== "other" && qtyNum > 1) {
        low = low + (qtyNum - 1) * Math.round(item.low * 0.4);
        high = high + (qtyNum - 1) * Math.round(item.high * 0.4);
      }
      if (property.value === "commercial") {
        low = Math.round(low * 1.2);
        high = Math.round(high * 1.2);
      }
      if (urgency === "emergency") {
        low = Math.round(low * 1.5);
        high = Math.round(high * 1.5);
      }

      // ---- availability ----
      var day = chosen.getDay(); // 0 = Sunday, 6 = Saturday
      var availability;
      var availClass = "ok";
      if (urgency === "emergency") {
        availability = "Emergency call-out: a plumber can usually be with you within 2 hours, 24/7.";
      } else if (day === 0) {
        availability = "Sundays are emergency call-outs only. The next standard slot is Monday from 07:30.";
        availClass = "warn";
      } else if (day === 6) {
        availability = "Limited Saturday slots (08:00 to 12:00). We will confirm by phone or email.";
        availClass = "warn";
      } else if (date.value === todayStr) {
        availability = "Same-day slots are limited. We'll call you shortly to confirm if we can make it today.";
        availClass = "warn";
      } else {
        availability = "Available. Standard weekday slots run 07:30 to 16:30.";
      }

      // ---- build the result with textContent (safe) ----
      output.textContent = "";
      var h = document.createElement("h4");
      setText(h, "Hi " + name.value.trim().split(" ")[0] + ", here's your estimate");
      var svc = document.createElement("p");
      setText(svc, item.label + (qtyNum > 1 && item.low !== item.high ? " (" + qtyNum + " points)" : "") +
        " - " + (property.value === "commercial" ? "business" : "home") + " property");
      var cost = document.createElement("p");
      cost.className = "quote-price";
      setText(cost, item.low === item.high && urgency === "standard" && property.value === "home"
        ? formatRand(low)
        : formatRand(low) + " - " + formatRand(high));
      var av = document.createElement("p");
      av.className = "quote-avail " + availClass;
      setText(av, availability);
      var note = document.createElement("p");
      note.className = "text-small";
      setText(note, "This is an estimate only. We confirm the final price on-site before any work starts. We'll also send details to " + email.value.trim() + ".");

      output.appendChild(h);
      output.appendChild(svc);
      output.appendChild(cost);
      output.appendChild(av);
      output.appendChild(note);

      placeholder.hidden = true;
      output.hidden = false;
      output.classList.remove("fade-in");
      void output.offsetWidth; // restart the CSS animation
      output.classList.add("fade-in");
    });
  }

  /* ---------- 5. SERVICES: SEARCH + SORT + ACCORDION ---------- */
  var searchBox = document.getElementById("serviceSearch");
  var serviceList = document.getElementById("serviceList");
  if (searchBox && serviceList) {
    var rows = Array.prototype.slice.call(serviceList.querySelectorAll(".service-row"));
    var noResults = document.getElementById("noResults");

    searchBox.addEventListener("input", function () {
      var term = searchBox.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var text = (row.getAttribute("data-name") + " " + row.getAttribute("data-keywords") + " " + row.textContent).toLowerCase();
        var match = term === "" || text.indexOf(term) !== -1;
        row.hidden = !match;
        if (match) { shown++; }
      });
      noResults.hidden = shown !== 0;
    });

    var sortBtn = document.getElementById("sortServices");
    var sorted = false;
    var originalOrder = rows.slice();
    sortBtn.addEventListener("click", function () {
      sorted = !sorted;
      var list = sorted
        ? rows.slice().sort(function (a, b) {
            return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
          })
        : originalOrder;
      list.forEach(function (row) { serviceList.appendChild(row); });
      sortBtn.setAttribute("aria-pressed", sorted ? "true" : "false");
      sortBtn.textContent = sorted ? "Reset order" : "Sort A\u2013Z";
    });
  }

  var accHeaders = document.querySelectorAll(".accordion-header");
  accHeaders.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      btn.querySelector(".acc-icon").textContent = isOpen ? "+" : "\u2212";
      // animate height with max-height (CSS handles the transition)
      panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
    });
  });

  /* ---------- 6. DYNAMIC REVIEWS (HOME) ---------- */
  var reviewList = document.getElementById("testimonialList");
  var moreBtn = document.getElementById("moreReviews");
  if (reviewList && moreBtn) {
    var reviews = [
      { text: "Called them out for a burst geyser on a Sunday morning and they were there within the hour. Fixed properly, no hidden costs.", who: "Sarah M., Randburg" },
      { text: "Been using Thorne & Co for our rental properties for two years now. Always on time and they explain exactly what needs doing.", who: "David K., Property Manager" },
      { text: "Found a leak behind our bathroom wall without breaking any tiles. Very neat work and fair pricing.", who: "Nomsa P., Fourways" },
      { text: "Kitchen drain was blocked for days. They cleared it in 30 minutes and showed me what caused it.", who: "Rudi V., Northcliff" },
      { text: "Booked online, got a price straight away and the plumber arrived exactly when they said.", who: "Aisha T., Sandton" }
    ];
    var shownCount = 2; // first two are already in the HTML

    function makeCard(r) {
      var card = document.createElement("div");
      card.className = "testimonial-card fade-in";
      var stars = document.createElement("div");
      stars.className = "stars";
      stars.textContent = "\u2605\u2605\u2605\u2605\u2605";
      var q = document.createElement("p");
      q.className = "quote";
      q.textContent = r.text;
      var a = document.createElement("p");
      a.className = "author";
      a.textContent = "\u2014 " + r.who;
      card.appendChild(stars);
      card.appendChild(q);
      card.appendChild(a);
      return card;
    }

    moreBtn.addEventListener("click", function () {
      var next = reviews.slice(shownCount, shownCount + 2);
      next.forEach(function (r) { reviewList.appendChild(makeCard(r)); });
      shownCount += next.length;
      if (shownCount >= reviews.length) {
        moreBtn.hidden = true;
      }
    });
  }

  /* ---------- 7. GALLERY LIGHTBOX ---------- */
  var lightLinks = document.querySelectorAll(".lightbox-link");
  if (lightLinks.length) {
    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.hidden = true;

    var lbImg = document.createElement("img");
    lbImg.alt = "";
    var lbCap = document.createElement("p");
    lbCap.className = "lightbox-caption";
    var lbClose = document.createElement("button");
    lbClose.type = "button";
    lbClose.className = "lightbox-close";
    lbClose.setAttribute("aria-label", "Close image");
    lbClose.textContent = "\u00D7";
    var lbPrev = document.createElement("button");
    lbPrev.type = "button";
    lbPrev.className = "lightbox-nav prev";
    lbPrev.setAttribute("aria-label", "Previous image");
    lbPrev.textContent = "\u2039";
    var lbNext = document.createElement("button");
    lbNext.type = "button";
    lbNext.className = "lightbox-nav next";
    lbNext.setAttribute("aria-label", "Next image");
    lbNext.textContent = "\u203A";

    overlay.appendChild(lbClose);
    overlay.appendChild(lbPrev);
    overlay.appendChild(lbImg);
    overlay.appendChild(lbNext);
    overlay.appendChild(lbCap);
    document.body.appendChild(overlay);

    var current = 0;
    var lastFocused = null;
    var links = Array.prototype.slice.call(lightLinks);

    function show(index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      lbImg.src = link.getAttribute("href");
      lbImg.alt = link.querySelector("img").alt;
      lbCap.textContent = link.getAttribute("data-caption");
    }
    function openBox(index) {
      lastFocused = document.activeElement;
      show(index);
      overlay.hidden = false;
      void overlay.offsetWidth;
      overlay.classList.add("open");
      document.body.classList.add("no-scroll");
      lbClose.focus();
    }
    function closeBox() {
      overlay.classList.remove("open");
      document.body.classList.remove("no-scroll");
      setTimeout(function () { overlay.hidden = true; }, 200);
      if (lastFocused) { lastFocused.focus(); }
    }

    links.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openBox(i);
      });
    });
    lbClose.addEventListener("click", closeBox);
    lbPrev.addEventListener("click", function () { show(current - 1); });
    lbNext.addEventListener("click", function () { show(current + 1); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) { closeBox(); }
    });
    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) { return; }
      if (e.key === "Escape") { closeBox(); }
      if (e.key === "ArrowLeft") { show(current - 1); }
      if (e.key === "ArrowRight") { show(current + 1); }
    });
  }

  /* ---------- 8. LEAFLET MAP (CONTACT) ---------- */
  var mapBox = document.getElementById("map");
  if (mapBox) {
    if (typeof L !== "undefined") {
      var randburg = [-26.0936, 28.0064];
      var map = L.map("map", { scrollWheelZoom: false }).setView(randburg, 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      L.marker(randburg).addTo(map).bindPopup("<strong>Thorne &amp; Co. Plumbing</strong><br>Randburg, Johannesburg");
      // circle showing roughly where we work
      L.circle(randburg, { radius: 9000, color: "#C97B3D", fillColor: "#C97B3D", fillOpacity: 0.12 }).addTo(map);
    } else {
      mapBox.textContent = "The map could not load. We are based in Randburg, Johannesburg.";
      mapBox.classList.add("map-fallback");
    }
  }

  /* ---------- 9. SCROLL ANIMATIONS ---------- */
  var animated = document.querySelectorAll(".icon-card, .team-card, .service-row, .gallery-pair, .mv-card, .testimonial-card");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animated.forEach(function (el) {
      el.classList.add("reveal");
      observer.observe(el);
    });
  }
});
