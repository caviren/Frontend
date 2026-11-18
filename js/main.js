(function () {
  var header = document.querySelector(".site-header");
  var nav = document.getElementById("site-nav");
  var menuBtn = document.querySelector(".menu-btn");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var track = document.querySelector(".t-track");
  var cards = track ? Array.prototype.slice.call(track.children) : [];
  var index = 0;

  function perView() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 980) return 2;
    return 3;
  }

  function renderCarousel() {
    if (!track || !cards.length) return;
    var n = perView();
    track.style.setProperty("--n", String(n));
    var max = Math.max(0, cards.length - n);
    if (index > max) index = max;
    if (prev) prev.hidden = max === 0;
    if (next) next.hidden = max === 0;
    var card = cards[0].getBoundingClientRect().width;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap);
    if (isNaN(gap)) gap = 20;
    track.style.transform = "translateX(-" + index * (card + gap) + "px)";
  }

  function spy() {
    var hero = document.querySelector(".hero");
    var pastHero = hero
      ? hero.getBoundingClientRect().bottom <= (header ? header.offsetHeight : 0)
      : window.scrollY > 8;
    if (header) header.classList.toggle("is-scrolled", pastHero);
    var y = window.scrollY + Math.min(window.innerHeight * 0.35, 360);
    var current = "top";
    links.forEach(function (link) {
      var id = link.getAttribute("data-nav");
      var section = document.getElementById(id === "top" ? "top" : id);
      if (!section) return;
      var top = id === "top" ? 0 : section.offsetTop;
      if (top <= y) current = id;
    });
    links.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-nav") === current);
    });
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        menuBtn.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
      }
    });
  }

  var prev = document.querySelector(".t-nav.prev");
  var next = document.querySelector(".t-nav.next");
  if (prev && next) {
    prev.addEventListener("click", function () {
      var max = Math.max(0, cards.length - perView());
      index = index <= 0 ? max : index - 1;
      renderCarousel();
    });
    next.addEventListener("click", function () {
      var max = Math.max(0, cards.length - perView());
      index = index >= max ? 0 : index + 1;
      renderCarousel();
    });
  }

  var demoTabs = Array.prototype.slice.call(document.querySelectorAll(".demo-tabs [role='tab']"));
  var demoUrl = document.querySelector(".browser-url");
  function showDemo(tab) {
    demoTabs.forEach(function (item) {
      var on = item === tab;
      item.setAttribute("aria-selected", on ? "true" : "false");
      item.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(item.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (demoUrl) {
      var viewName = tab.getAttribute("data-view") || "concept";
      demoUrl.setAttribute("data-view", viewName);
      var currentUrl = demoUrl.textContent || "";
      var splitAt = currentUrl.indexOf(" · ");
      if (currentUrl.indexOf("ideas / ") === 0 && splitAt > 0) {
        demoUrl.textContent = "ideas / " + viewName + currentUrl.slice(splitAt);
      }
    }
  }
  demoTabs.forEach(function (tab, tabIndex) {
    tab.addEventListener("click", function () { showDemo(tab); });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      var next = event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (tabIndex + 1) % demoTabs.length
        : (tabIndex - 1 + demoTabs.length) % demoTabs.length;
      demoTabs[next].focus();
      showDemo(demoTabs[next]);
    });
  });

  var previewLive = document.getElementById("preview-live");
  var previewFields = Array.prototype.slice.call(document.querySelectorAll("[data-preview]"));
  function previewValue(data, path) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key] !== undefined ? value[key] : null;
    }, data);
  }
  function renderPreview(data) {
    if (!data) return;
    previewFields.forEach(function (field) {
      var value = previewValue(data, field.getAttribute("data-preview"));
      if (Array.isArray(value)) {
        field.textContent = "";
        value.forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = item;
          field.appendChild(li);
        });
        return;
      }
      if (typeof value === "string") field.textContent = value;
    });
  }
  function setPreviewState(state, label) {
    if (!previewLive) return;
    previewLive.setAttribute("data-state", state);
    var text = previewLive.querySelector("span");
    if (text) text.textContent = label;
  }
  var ideaWorlds = [
    ["Glass atrium", "a glass atrium"],
    ["Night market", "a night market"],
    ["Canyon volume", "a canyon volume"],
    ["Flooded platform", "a flooded platform"],
    ["Harbor stage", "a harbor at blue hour"],
    ["Paper city", "a paper city"],
    ["Orbital greenhouse", "an orbital greenhouse"],
    ["Desert practical", "a desert practical"]
  ];
  var ideaLights = ["warm rain", "a single practical", "hard noon", "blue-hour haze", "a passing storm"];
  var ideaDevices = ["one continuous take", "a wet lens", "two times of day", "the set left standing", "a moving camera"];
  var ideaShots = [
    ["volume floor", "Wide from the volume floor"],
    ["practical", "Insert on the practical"],
    ["doorway", "Push through the doorway"],
    ["overhead", "Top-down across the stage"],
    ["reflection", "Catch the plate in a reflection"]
  ];
  var ideaMoves = ["Generate the plate", "Compare both takes", "Send for a note", "Lock version B", "Hold the weather", "Swap the time of day", "Keep the set standing"];
  var ideaCount = 0;
  var ideaLast = "";
  function ideaPick(list, salt) {
    return list[Math.abs((ideaCount * 7 + salt * 3) % list.length) % list.length];
  }
  function nextIdea() {
    ideaCount += 1;
    var world = ideaPick(ideaWorlds, 1);
    var light = ideaPick(ideaLights, 2);
    var device = ideaPick(ideaDevices, 3);
    var shot = ideaPick(ideaShots, 4);
    var signature = world[0] + light + device + shot[0];
    if (signature === ideaLast) {
      light = ideaLights[(ideaLights.indexOf(light) + 1) % ideaLights.length];
      signature = world[0] + light + device + shot[0];
    }
    ideaLast = signature;
    var moveAt = Math.abs(ideaCount * 5) % ideaMoves.length;
    var moves = [0, 1, 2].map(function (step) {
      return ideaMoves[(moveAt + step) % ideaMoves.length];
    });
    var shotNo = ideaCount < 10 ? "0" + ideaCount : String(ideaCount);
    return {
      view: (demoUrl && demoUrl.getAttribute("data-view")) || "concept",
      registry: {
        kicker: "Concept",
        title: world[0] + ", " + light + ".",
        summary: "A generative plate for " + world[1] + ", held in " + device + ".",
        statusLabel: "Idea " + shotNo,
        facts: [device, light, "Live idea"]
      },
      scene: {
        kicker: "Shot",
        title: "Shot " + shotNo + ", " + shot[0] + ".",
        summary: shot[1] + ", while " + world[1] + " holds " + light + ".",
        facts: ["Plate live", device, light]
      },
      approvals: {
        kicker: "Next move",
        title: moves[0] + ".",
        summary: "The room can take this idea forward without leaving the record.",
        facts: moves
      }
    };
  }
  function showIdea() {
    if (!previewLive || !previewFields.length) return;
    var idea = nextIdea();
    renderPreview(idea);
    document.querySelectorAll(".demo-screen").forEach(function (panel) {
      panel.classList.remove("preview-fresh");
    });
    window.requestAnimationFrame(function () {
      document.querySelectorAll(".demo-screen").forEach(function (panel) {
        panel.classList.add("preview-fresh");
      });
    });
    if (demoUrl) demoUrl.textContent = "ideas / " + idea.view + " · " + idea.registry.statusLabel.toLowerCase();
    setPreviewState("live", "Live");
    var delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 12000 : 4000;
    window.setTimeout(showIdea, delay);
  }
  if (previewLive && previewFields.length) showIdea();

  var form = document.getElementById("contact-form");
  var done = document.getElementById("form-done");
  var resetBtn = document.getElementById("form-reset");
  function setError(input, message) {
    var error = document.getElementById(input.id + "-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) input.setAttribute("aria-describedby", input.id + "-error");
    else input.removeAttribute("aria-describedby");
    if (error) error.textContent = message || "";
  }
  if (form && done) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = document.getElementById("contact-name");
      var email = document.getElementById("contact-email");
      var message = document.getElementById("contact-message");
      var type = form.querySelector('input[name="type"]:checked');
      var nameValue = name.value.trim();
      var emailValue = email.value.trim();
      var messageValue = message.value.trim();
      var valid = true;
      if (!nameValue) { setError(name, "Add your name."); valid = false; }
      else setError(name, "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) { setError(email, "Add a valid email."); valid = false; }
      else setError(email, "");
      if (messageValue.length < 8) { setError(message, "Tell us a little about the production."); valid = false; }
      else setError(message, "");
      var captchaError = document.getElementById("contact-captcha-error");
      var token = window.grecaptcha ? grecaptcha.getResponse() : "";
      if (!token) {
        if (captchaError) captchaError.textContent = "Confirm you are not a robot.";
        valid = false;
      } else if (captchaError) {
        captchaError.textContent = "";
      }
      if (!valid) return;
      var submitBtn = form.querySelector("[type=submit]");
      if (submitBtn) submitBtn.disabled = true;
      function showDone() {
        var title = document.getElementById("form-done-title");
        var copy = document.getElementById("form-done-copy");
        if (title) title.textContent = "Thanks, " + nameValue + ".";
        if (copy) copy.textContent = "Your note about " + (type ? type.value.toLowerCase() : "the project") + " is in.";
        form.reset();
        if (window.grecaptcha) grecaptcha.reset();
        form.hidden = true;
        done.hidden = false;
      }
      fetch("api/verify-recaptcha.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token })
      }).then(function (response) {
        var type = response.headers.get("content-type") || "";
        if (!response.ok || type.indexOf("application/json") === -1) return null;
        return response.json();
      }).then(function (data) {
        if (data && data.success === false) throw new Error("captcha");
        showDone();
      }).catch(function () {
        if (captchaError) captchaError.textContent = "Captcha check failed. Try again.";
        if (window.grecaptcha) grecaptcha.reset();
      }).then(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }
  var newsForm = document.getElementById("news-form");
  var newsDone = document.getElementById("news-done");
  if (newsForm && newsDone) {
    newsForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = document.getElementById("news-email");
      var error = document.getElementById("news-email-error");
      var value = email.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      email.setAttribute("aria-invalid", valid ? "false" : "true");
      if (error) error.textContent = valid ? "" : "Add a valid email.";
      if (!valid) {
        email.focus();
        return;
      }
      newsForm.reset();
      newsForm.hidden = true;
      newsDone.hidden = false;
    });
  }

  if (resetBtn && form && done) {
    resetBtn.addEventListener("click", function () {
      done.hidden = true;
      form.hidden = false;
      if (window.grecaptcha) grecaptcha.reset();
      var name = document.getElementById("contact-name");
      if (name) name.focus();
    });
  }

  window.addEventListener("resize", renderCarousel);
  window.addEventListener("scroll", spy, { passive: true });
  renderCarousel();
  spy();

  var caseDialog = document.getElementById("case-dialog");
  var casePanels = caseDialog ? Array.prototype.slice.call(caseDialog.querySelectorAll("[data-panel]")) : [];
  var caseButtons = Array.prototype.slice.call(document.querySelectorAll(".case .go-orange"));
  function openCase(id) {
    if (!caseDialog) return;
    casePanels.forEach(function (panel) {
      var on = panel.getAttribute("data-panel") === id;
      panel.hidden = !on;
      if (on) {
        var title = panel.querySelector("h3");
        if (title) caseDialog.setAttribute("aria-labelledby", title.id);
      }
    });
    document.body.style.overflow = "hidden";
    caseDialog.showModal();
  }
  caseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      openCase(button.getAttribute("data-case"));
    });
  });
  if (caseDialog) {
    caseDialog.addEventListener("click", function (event) {
      if (event.target === caseDialog || event.target.closest("[data-close]")) caseDialog.close();
    });
    caseDialog.addEventListener("close", function () {
      document.body.style.overflow = "";
    });
  }
})();
