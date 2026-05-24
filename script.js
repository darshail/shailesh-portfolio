// === THEME (must run first) ===
(function initThemeEarly() {
  const stored = localStorage.getItem("aanya-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();

// === SCROLL PROGRESS BAR ===
(function initScrollProgress() {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);

  let ticking = false;

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateProgress();
})();

// === REVEAL ON SCROLL ===
(function initRevealOnScroll() {
  const revealElements = document.querySelectorAll(".reveal");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((el) => observer.observe(el));
})();

// === NAV SHRINK ON SCROLL ===
(function initNavShrink() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// === ABOUT STATS COUNTERS ===
(function initAboutStatsCounters() {
  const statsSection = document.querySelector(".about-stats");
  if (!statsSection) return;

  const counters = statsSection.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = Number(el.getAttribute("data-count"));
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach(animateCounter);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );

  observer.observe(statsSection);
})();

// === PAGE-LOAD SPLASH ===
(function initPageSplash() {
  const splash = document.createElement("div");
  splash.className = "page-splash";
  splash.innerHTML = '<p class="page-splash__brand">Shailesh Ghode</p>';
  document.body.appendChild(splash);

  window.requestAnimationFrame(() => {
    splash.classList.add("is-active");
  });

  window.setTimeout(() => {
    splash.classList.add("is-done");
    window.setTimeout(() => splash.remove(), 320);
  }, 900);
})();

// === THEME TOGGLE UI ===
(function initThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const syncToggle = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.textContent = isDark ? "☀️" : "🌙";
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("aanya-theme", next);
    syncToggle();
  });

  syncToggle();
})();

console.log("Portfolio loaded ✅");

const contactForm = document.getElementById("contact-form");

if (contactForm) {
  const contactSuccess = document.getElementById("contact-success");

  // Create a red error message element (reused on every failed submit)
  let contactError = document.getElementById("contact-error");
  if (!contactError) {
    contactError = document.createElement("p");
    contactError.id = "contact-error";
    contactError.hidden = true;
    contactError.style.cssText =
      "margin:0;padding:24px;border-radius:8px;background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c;line-height:1.6;";
    contactForm.parentNode.insertBefore(contactError, contactSuccess);
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    // Hide any previous error before trying again
    contactError.hidden = true;

    // Read the four field values the database expects
    const full_name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const subject = contactForm.subject.value;
    const message = contactForm.message.value.trim();

    // Insert a new row into the Supabase "form" table
    const response = await supabaseClient
      .from("form")
      .insert([{ full_name, email, subject, message }]);

    console.log(response);

    // If Supabase returns an error, keep the form visible and show a message
    if (response.error) {
      console.error("Supabase error:", response.error);

      // "Failed to fetch" means the browser could not reach Supabase at all (DNS/network)
      const isNetworkError =
        response.error.message === "Failed to fetch" ||
        response.error.message?.includes("Failed to fetch");

      contactError.textContent = isNetworkError
        ? "Can't reach Supabase. Check your internet connection, try again in a few minutes, or switch your DNS to 8.8.8.8 in Windows network settings."
        : "Something went wrong. Please try again.";
      contactError.hidden = false;
      return;
    }

    // Success: hide the form, show the green message, and clear the fields
    contactForm.hidden = true;
    contactSuccess.hidden = false;
    contactForm.reset();
  });
}

const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav__toggle");

if (nav && navToggle) {
  const navIcon = navToggle.querySelector(".nav__toggle-icon");

  const closeNav = () => {
    nav.classList.remove("nav--open");
    navToggle.setAttribute("aria-expanded", "false");
    if (navIcon) {
      navIcon.textContent = "☰";
    }
  };

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav--open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    if (navIcon) {
      navIcon.textContent = isOpen ? "✕" : "☰";
    }
  });

  nav.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", closeNav);
  });
}
