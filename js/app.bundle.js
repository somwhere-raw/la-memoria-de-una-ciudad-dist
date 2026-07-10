(() => {
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // js/core/state.js
  var EVIDENCE_KEYS = Object.freeze([
    "ernesto196",
    "lucia247",
    "quispe247Confirmed"
  ]);
  var _data, _listeners, _StateManager_instances, emit_fn, derivedSnapshot_fn, emitDerivedChanges_fn;
  var StateManager = class {
    constructor() {
      __privateAdd(this, _StateManager_instances);
      __privateAdd(this, _data, {
        spineProgress: 0,
        activeBranch: null,
        activeBeat: null,
        visitedBranches: /* @__PURE__ */ new Set(),
        completedBranches: /* @__PURE__ */ new Set(),
        evidence: {
          ernesto196: false,
          lucia247: false,
          quispe247Confirmed: false
        },
        combinationEntered: false,
        compartmentOpened: false,
        secondRollReviewed: false,
        reducedMotion: false
      });
      __privateAdd(this, _listeners, /* @__PURE__ */ new Map());
    }
    get(key) {
      if (key === "archiveUnlocked") {
        return EVIDENCE_KEYS.every((evidenceKey) => __privateGet(this, _data).evidence[evidenceKey]);
      }
      if (key === "lastPointUnlocked") {
        return __privateGet(this, _data).completedBranches.has("libreta");
      }
      if (key === "lastMemoryUnlocked") {
        return __privateGet(this, _data).completedBranches.has("map-col");
      }
      if (key === "climaxUnlocked") {
        return __privateGet(this, _data).secondRollReviewed;
      }
      return __privateGet(this, _data)[key];
    }
    set(key, value) {
      if (key === "archiveUnlocked" || key === "lastPointUnlocked" || key === "lastMemoryUnlocked" || key === "climaxUnlocked") {
        console.warn(`"${key}" es un estado derivado y no puede escribirse.`);
        return;
      }
      const previousDerived = __privateMethod(this, _StateManager_instances, derivedSnapshot_fn).call(this);
      const prev = __privateGet(this, _data)[key];
      if (sameValue(prev, value)) return;
      __privateGet(this, _data)[key] = value;
      __privateMethod(this, _StateManager_instances, emit_fn).call(this, key, value, prev);
      __privateMethod(this, _StateManager_instances, emitDerivedChanges_fn).call(this, previousDerived);
    }
    recordEvidence(key) {
      if (!EVIDENCE_KEYS.includes(key)) {
        console.warn(`Evidencia desconocida: "${key}".`);
        return;
      }
      if (__privateGet(this, _data).evidence[key]) return;
      this.set("evidence", { ...__privateGet(this, _data).evidence, [key]: true });
    }
    markVisited(branchId) {
      const branches = new Set(__privateGet(this, _data).visitedBranches);
      branches.add(branchId);
      this.set("visitedBranches", branches);
    }
    markCompleted(branchId) {
      const branches = new Set(__privateGet(this, _data).completedBranches);
      branches.add(branchId);
      this.set("completedBranches", branches);
    }
    on(keys, fn) {
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((key) => {
        if (!__privateGet(this, _listeners).has(key)) __privateGet(this, _listeners).set(key, /* @__PURE__ */ new Set());
        __privateGet(this, _listeners).get(key).add(fn);
      });
      return () => this.off(keys, fn);
    }
    off(keys, fn) {
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((key) => {
        var _a2;
        return (_a2 = __privateGet(this, _listeners).get(key)) == null ? void 0 : _a2.delete(fn);
      });
    }
    snapshot() {
      return {
        ...__privateGet(this, _data),
        visitedBranches: new Set(__privateGet(this, _data).visitedBranches),
        completedBranches: new Set(__privateGet(this, _data).completedBranches),
        evidence: { ...__privateGet(this, _data).evidence },
        archiveUnlocked: this.get("archiveUnlocked"),
        lastPointUnlocked: this.get("lastPointUnlocked"),
        lastMemoryUnlocked: this.get("lastMemoryUnlocked"),
        climaxUnlocked: this.get("climaxUnlocked")
      };
    }
  };
  _data = new WeakMap();
  _listeners = new WeakMap();
  _StateManager_instances = new WeakSet();
  emit_fn = function(key, value, prev) {
    var _a2;
    (_a2 = __privateGet(this, _listeners).get(key)) == null ? void 0 : _a2.forEach((fn) => {
      try {
        fn(value, prev);
      } catch (error) {
        console.error(`State listener error [${key}]:`, error);
      }
    });
  };
  derivedSnapshot_fn = function() {
    return {
      archiveUnlocked: this.get("archiveUnlocked"),
      lastPointUnlocked: this.get("lastPointUnlocked"),
      lastMemoryUnlocked: this.get("lastMemoryUnlocked"),
      climaxUnlocked: this.get("climaxUnlocked")
    };
  };
  emitDerivedChanges_fn = function(previous) {
    Object.keys(previous).forEach((key) => {
      const value = this.get(key);
      if (value !== previous[key]) __privateMethod(this, _StateManager_instances, emit_fn).call(this, key, value, previous[key]);
    });
  };
  function sameValue(a, b) {
    if (a === b) return true;
    if (a instanceof Set && b instanceof Set) {
      return a.size === b.size && [...a].every((value) => b.has(value));
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((value, index) => value === b[index]);
    }
    return false;
  }
  var state = new StateManager();
  var _a, _b;
  if (typeof window !== "undefined") {
    const mediaQuery = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-reduced-motion: reduce)");
    state.set("reducedMotion", Boolean(mediaQuery == null ? void 0 : mediaQuery.matches));
    (_b = mediaQuery == null ? void 0 : mediaQuery.addEventListener) == null ? void 0 : _b.call(mediaQuery, "change", (event) => {
      state.set("reducedMotion", event.matches);
    });
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      window.__LMDC_STATE__ = state;
    }
  }

  // js/core/scroll.js
  var lenis = null;
  var isPaused = false;
  function initScroll() {
    const reduced = state.get("reducedMotion");
    const hasGsap = typeof window.gsap !== "undefined";
    const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
    const hasLenis = typeof window.Lenis !== "undefined";
    if (!hasGsap || !hasScrollTrigger) {
      console.info("Scroll avanzado no disponible; se usa el desplazamiento nativo.");
      return null;
    }
    gsap.registerPlugin(ScrollTrigger);
    if (reduced || !hasLenis) {
      ScrollTrigger.refresh();
      return null;
    }
    lenis = new Lenis({
      duration: 1.1,
      // Editorial, no instantáneo
      lerp: 0.08,
      // Bajo = sensación de papel deslizándose
      smoothWheel: true,
      smoothTouch: false,
      // Sin override agresivo en touch — UX nativa móvil
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      infinite: false
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      if (!isPaused) lenis.raf(time * 1e3);
    });
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    });
    ScrollTrigger.addEventListener("refresh", () => lenis.resize());
    ScrollTrigger.refresh();
    return lenis;
  }
  function pause() {
    isPaused = true;
    document.documentElement.classList.add("is-branch-open");
    document.body.style.overflow = "hidden";
    lenis == null ? void 0 : lenis.stop();
  }
  function resume() {
    isPaused = false;
    document.documentElement.classList.remove("is-branch-open");
    document.body.style.overflow = "";
    lenis == null ? void 0 : lenis.start();
  }
  function scrollTo(target, options = {}) {
    var _a2;
    const { immediate = false, offset = 0, duration = 1.1 } = options;
    if (lenis) {
      lenis.scrollTo(target, { immediate, offset, duration });
    } else {
      const y = typeof target === "number" ? target : (typeof target === "string" ? ((_a2 = document.querySelector(target)) == null ? void 0 : _a2.getBoundingClientRect().top) + window.scrollY : (target == null ? void 0 : target.getBoundingClientRect().top) + window.scrollY) || 0;
      window.scrollTo({
        top: y + offset,
        behavior: immediate || state.get("reducedMotion") ? "auto" : "smooth"
      });
    }
  }
  function getScrollY() {
    return lenis ? lenis.scroll : window.scrollY;
  }

  // js/core/reveal.js
  var DEFAULT_DURATION = 0.9;
  var CLIMAX_DURATION = 1.4;
  var observer = null;
  var revealTargets = [];
  var scrollCheckQueued = false;
  var activatedTargets = /* @__PURE__ */ new WeakSet();
  function initReveal() {
    const reduced = state.get("reducedMotion");
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateTarget(entry.target, reduced);
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -10% 0px"
      }
    );
    revealTargets = [...document.querySelectorAll(".reveal-target")];
    revealTargets.forEach((el) => {
      bindImageSafetyReveal(el);
      observer.observe(el);
    });
    window.addEventListener("scroll", () => {
      if (scrollCheckQueued) return;
      scrollCheckQueued = true;
      requestAnimationFrame(() => {
        scrollCheckQueued = false;
        activateNearbyTargets(reduced);
      });
    }, { passive: true });
    activateNearbyTargets(reduced);
    window.setTimeout(() => activateNearbyTargets(reduced), 250);
    window.setTimeout(() => activateNearbyTargets(reduced), 1e3);
  }
  function activateTarget(el, reduced) {
    if (activatedTargets.has(el)) return;
    activatedTargets.add(el);
    observer == null ? void 0 : observer.unobserve(el);
    revealWhenReady(el, reduced);
  }
  function activateNearbyTargets(reduced) {
    revealTargets.forEach((el) => {
      if (activatedTargets.has(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.2 && rect.bottom > -window.innerHeight * 0.2) {
        activateTarget(el, reduced);
      }
    });
  }
  async function revealWhenReady(el, reduced) {
    if (el.tagName === "IMG" && el.dataset.src && !el.getAttribute("src")) {
      const loaded = waitForImage(el);
      el.loading = "eager";
      el.setAttribute("src", el.dataset.src);
      const succeeded = await loaded;
      if (!succeeded) el.classList.add("asset-missing");
    } else if (el.tagName === "IMG" && el.getAttribute("src") && !el.complete) {
      const succeeded = await waitForImage(el);
      if (!succeeded) el.classList.add("asset-missing");
    }
    if (reduced) {
      el.classList.add("is-revealed");
      return;
    }
    const delay = parseInt(el.dataset.revealDelay || "0", 10) / 1e3;
    const isClimax = el.classList.contains("reveal-target--climax");
    await revealElement(el, { delay, climax: isClimax });
  }
  function bindImageSafetyReveal(el) {
    if (el.tagName !== "IMG") return;
    if (el.dataset.revealSafetyBound === "true") return;
    el.dataset.revealSafetyBound = "true";
    el.addEventListener("load", () => {
      if (el.naturalWidth > 0 && !activatedTargets.has(el)) {
        const rect = el.getBoundingClientRect();
        const hasLayout = rect.width > 0 && rect.height > 0;
        if (hasLayout) activateTarget(el, state.get("reducedMotion"));
      }
    });
    el.addEventListener("error", () => {
      el.classList.add("asset-missing", "is-revealed");
    });
  }
  function waitForImage(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve(true);
    return new Promise((resolve) => {
      const finish = (succeeded) => {
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
        resolve(succeeded);
      };
      const onLoad = () => finish(true);
      const onError = () => finish(false);
      image.addEventListener("load", onLoad, { once: true });
      image.addEventListener("error", onError, { once: true });
    });
  }
  function revealElement(el, { delay = 0, climax = false } = {}) {
    const reduced = state.get("reducedMotion");
    const duration = climax ? CLIMAX_DURATION : DEFAULT_DURATION;
    const finalSaturate = climax ? 0.85 : 1;
    if (reduced || typeof window.gsap === "undefined") {
      el.classList.add("is-revealed");
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      gsap.to(el, {
        clipPath: "inset(0 0% 0 0)",
        filter: `brightness(1) saturate(${finalSaturate})`,
        duration,
        delay,
        ease: "developReveal",
        // Registrado abajo desde --ease-develop
        onStart: () => el.classList.add("is-revealing"),
        onComplete: () => {
          el.classList.remove("is-revealing");
          el.classList.add("is-revealed");
          resolve();
        }
      });
    });
  }
  function registerEasings() {
    if (typeof window.gsap === "undefined") return;
    gsap.registerEase("developReveal", cubicBezierEase(0.22, 0.58, 0.36, 1));
  }
  function cubicBezierEase(x1, y1, x2, y2) {
    return function(t) {
      const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
      const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
      const sampleX = (u2) => ((ax * u2 + bx) * u2 + cx) * u2;
      const sampleY = (u2) => ((ay * u2 + by) * u2 + cy) * u2;
      let u = t;
      for (let i = 0; i < 6; i++) {
        const x = sampleX(u) - t;
        if (Math.abs(x) < 1e-4) break;
        const dx = (3 * ax * u + 2 * bx) * u + cx;
        u -= dx === 0 ? 0 : x / dx;
      }
      return sampleY(u);
    };
  }
  function observe(el) {
    if (!el) return;
    bindImageSafetyReveal(el);
    if (!revealTargets.includes(el)) revealTargets.push(el);
    observer == null ? void 0 : observer.observe(el);
    window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.2 && rect.bottom > -window.innerHeight * 0.2) {
        activateTarget(el, state.get("reducedMotion"));
      }
    });
  }

  // js/data/spine-beats.js
  var SPINE_BEATS = [
    {
      id: "hallazgo",
      type: "hero",
      domSelector: "#beat-hallazgo",
      branch: null,
      lockCondition: null,
      scrollPin: true,
      pinDuration: "100%",
      revealType: "image",
      revealDelay: 0.3
    },
    {
      id: "pista",
      type: "prose",
      domSelector: "#beat-pista",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0
    },
    {
      id: "rollo",
      type: "image-sequence",
      domSelector: "#beat-rollo",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "contact-sheet",
      revealDelay: 0.1
    },
    {
      id: "instagram",
      type: "prose",
      domSelector: "#beat-instagram",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0
    },
    {
      id: "ernesto",
      type: "branch-node",
      domSelector: "#beat-ernesto",
      branch: "podcast",
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0,
      // Fragmento de código que se recoge al COMPLETAR esta rama
      codeFragment: 196
    },
    {
      id: "lucia",
      type: "branch-node",
      domSelector: "#beat-lucia",
      branch: "mapa",
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0,
      codeFragment: 247
    },
    {
      id: "quispe",
      type: "branch-node",
      domSelector: "#beat-quispe",
      branch: "video",
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0,
      // Confirmación cruzada del mismo fragmento que entrega Lucía,
      // no un tercer dígito independiente.
      codeFragment: 247
    },
    {
      id: "mecanismo",
      type: "prose",
      domSelector: "#beat-mecanismo",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0.2
    },
    {
      id: "codigo",
      type: "lock-gate",
      domSelector: "#beat-codigo",
      branch: "archivo",
      // La condición se evalúa en tiempo real contra state
      lockCondition: (state2) => state2.get("archiveUnlocked"),
      scrollPin: false,
      revealType: "none",
      revealDelay: 0
    },
    {
      id: "gabriel",
      type: "branch-node",
      domSelector: "#beat-gabriel",
      branch: "libreta",
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0
    },
    {
      id: "mapa-col",
      type: "branch-node",
      domSelector: "#beat-mapa-col",
      branch: "map-col",
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0
    },
    {
      id: "brena",
      type: "prose",
      domSelector: "#beat-brena",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0.2
    },
    {
      id: "nina",
      type: "climax",
      domSelector: "#beat-nina",
      branch: null,
      lockCondition: null,
      scrollPin: true,
      pinDuration: "80%",
      revealType: "climax",
      revealDelay: 0.6
    },
    {
      id: "nota",
      type: "quote",
      domSelector: "#beat-nota",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0.4
    },
    {
      id: "cierre",
      type: "resolution",
      domSelector: "#beat-cierre",
      branch: null,
      lockCondition: null,
      scrollPin: false,
      revealType: "text",
      revealDelay: 0
    }
  ];
  var BEATS_BY_ID = Object.fromEntries(
    SPINE_BEATS.map((beat) => [beat.id, beat])
  );

  // js/spine/spine.js
  var onBranchActivate = null;
  var highestRevealedBeat = 0;
  var ACT_BY_BEAT = {
    hallazgo: "La ciudad inadvertida",
    pista: "La ciudad inadvertida",
    rollo: "Bajo la luz roja",
    instagram: "Los nombres",
    ernesto: "Los nombres",
    lucia: "Los nombres",
    quispe: "Los nombres",
    mecanismo: "La combinaci\xF3n",
    codigo: "La combinaci\xF3n",
    gabriel: "El archivo de Gabriel",
    "mapa-col": "La \xFAltima memoria",
    brena: "La \xFAltima memoria",
    nina: "La \xFAltima memoria",
    nota: "La \xFAltima memoria",
    cierre: "La ciudad recuerda"
  };
  function initSpine({ onActivateBranch } = {}) {
    onBranchActivate = onActivateBranch;
    registerScrollTriggers();
    bindIndicatorNav();
    bindBranchTriggerButtons();
    bindLockGate();
    bindContactSheetFlip();
    bindInstagramThumbs();
    bindHomeLink();
    updateIndicatorAvailability(0);
    bindNarrativeGates();
    updateCurrentAct(SPINE_BEATS[0]);
  }
  function bindNarrativeGates() {
    const sync = () => {
      setGate(["#beat-mecanismo", "#beat-codigo"], state.get("archiveUnlocked"));
      setGate(["#beat-gabriel"], state.get("compartmentOpened"));
      setGate(["#beat-mapa-col"], state.get("lastPointUnlocked"));
      setGate(["#beat-brena"], state.get("lastMemoryUnlocked"));
      setGate(
        ["#beat-nina", "#beat-nota", "#beat-cierre"],
        state.get("climaxUnlocked")
      );
      refreshScrollTriggers();
    };
    state.on(
      [
        "archiveUnlocked",
        "compartmentOpened",
        "lastPointUnlocked",
        "lastMemoryUnlocked",
        "climaxUnlocked"
      ],
      sync
    );
    sync();
  }
  function setGate(selectors, isOpen) {
    selectors.forEach((selector) => {
      const section = document.querySelector(selector);
      section == null ? void 0 : section.classList.toggle("is-gate-open", Boolean(isOpen));
      section == null ? void 0 : section.setAttribute("aria-hidden", String(!isOpen));
    });
  }
  function registerScrollTriggers() {
    if (typeof window.ScrollTrigger === "undefined") {
      registerNativeObservers();
      return;
    }
    SPINE_BEATS.forEach((beat) => {
      const section = document.querySelector(beat.domSelector);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => activateBeat(beat),
        onEnterBack: () => activateBeat(beat),
        onLeave: () => maybeDeactivate(beat),
        onLeaveBack: () => maybeDeactivate(beat)
      });
      if (beat.scrollPin && !state.get("reducedMotion")) {
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: `+=${beat.pinDuration || "100%"}`,
          pin: true,
          pinSpacing: true
        });
      }
    });
    const spineEl = document.querySelector("#spine");
    ScrollTrigger.create({
      trigger: spineEl,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        state.set("spineProgress", self.progress);
        const fill = document.querySelector("#spine-fill");
        if (fill) fill.style.height = `${self.progress * 100}%`;
        spineEl == null ? void 0 : spineEl.style.setProperty("--spine-progress", String(self.progress));
      }
    });
  }
  function registerNativeObservers() {
    const observer2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const beat = SPINE_BEATS.find((item) => item.domSelector === `#${entry.target.id}`);
        if (beat) activateBeat(beat);
      });
    }, { rootMargin: "-35% 0px -45%", threshold: 0 });
    SPINE_BEATS.forEach((beat) => {
      const section = document.querySelector(beat.domSelector);
      if (section) observer2.observe(section);
    });
    const updateProgress = () => {
      const spineEl = document.querySelector("#spine");
      if (!spineEl) return;
      const rect = spineEl.getBoundingClientRect();
      const distance = Math.max(1, spineEl.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      state.set("spineProgress", progress);
      const fill = document.querySelector("#spine-fill");
      if (fill) fill.style.height = `${progress * 100}%`;
      spineEl.style.setProperty("--spine-progress", String(progress));
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }
  function activateBeat(beat) {
    var _a2;
    const section = document.querySelector(beat.domSelector);
    const rect = section == null ? void 0 : section.getBoundingClientRect();
    const isActuallyInReadingZone = rect && rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.15;
    if (!isActuallyInReadingZone) return;
    state.set("activeBeat", beat.id);
    updateCurrentAct(beat);
    const beatIndex = SPINE_BEATS.findIndex((item) => item.id === beat.id);
    if (beatIndex >= 0) {
      highestRevealedBeat = Math.max(highestRevealedBeat, beatIndex);
      updateIndicatorAvailability(highestRevealedBeat);
    }
    const node = document.querySelector(
      `.spine-indicator__node[data-target="${beat.domSelector.replace("#", "")}"]`
    );
    document.querySelectorAll(".spine-indicator__node.is-active").forEach((n) => {
      var _a3;
      n.classList.remove("is-active");
      (_a3 = n.querySelector(".spine-indicator__dot")) == null ? void 0 : _a3.removeAttribute("aria-current");
    });
    node == null ? void 0 : node.classList.add("is-active");
    (_a2 = node == null ? void 0 : node.querySelector(".spine-indicator__dot")) == null ? void 0 : _a2.setAttribute("aria-current", "step");
    if (beat.codeFragment && state.get("completedBranches").has(beat.branch)) {
      markIndicatorComplete(beat.domSelector.replace("#", ""));
    }
  }
  function updateCurrentAct(beat) {
    const actName = ACT_BY_BEAT[beat == null ? void 0 : beat.id] || "La ciudad inadvertida";
    const actElement = document.querySelector("#current-act");
    if (actElement && actElement.textContent !== actName) {
      actElement.textContent = actName;
    }
    document.body.dataset.currentAct = (beat == null ? void 0 : beat.id) || "hallazgo";
  }
  function updateIndicatorAvailability(highestIndex) {
    document.querySelectorAll(".spine-indicator__node").forEach((node) => {
      const dot = node.querySelector(".spine-indicator__dot");
      if (!dot) return;
      const targetId = node.dataset.target;
      const index = SPINE_BEATS.findIndex((beat) => beat.domSelector === `#${targetId}`);
      if (!dot.dataset.revealedLabel) {
        dot.dataset.revealedLabel = dot.getAttribute("aria-label") || "Momento del relato";
      }
      const isFuture = index > highestIndex;
      dot.disabled = isFuture;
      dot.setAttribute("aria-disabled", String(isFuture));
      dot.setAttribute(
        "aria-label",
        isFuture ? "Momento del recorrido a\xFAn no revelado" : dot.dataset.revealedLabel
      );
      node.classList.toggle("is-future", isFuture);
    });
  }
  function bindHomeLink() {
    const homeLink = document.querySelector('.story-header__title[href="#beat-hallazgo"]');
    const firstBeat = SPINE_BEATS[0];
    if (!homeLink || !firstBeat) return;
    homeLink.addEventListener("click", () => {
      var _a2;
      state.set("activeBeat", firstBeat.id);
      updateCurrentAct(firstBeat);
      document.querySelectorAll(".spine-indicator__node.is-active").forEach((node) => {
        var _a3;
        node.classList.remove("is-active");
        (_a3 = node.querySelector(".spine-indicator__dot")) == null ? void 0 : _a3.removeAttribute("aria-current");
      });
      const firstNode = document.querySelector(
        `.spine-indicator__node[data-target="${firstBeat.domSelector.replace("#", "")}"]`
      );
      firstNode == null ? void 0 : firstNode.classList.add("is-active");
      (_a2 = firstNode == null ? void 0 : firstNode.querySelector(".spine-indicator__dot")) == null ? void 0 : _a2.setAttribute("aria-current", "step");
    });
  }
  function maybeDeactivate(beat) {
  }
  function markIndicatorComplete(target) {
    const node = document.querySelector(`.spine-indicator__node[data-target="${target}"]`);
    node == null ? void 0 : node.classList.add("is-complete");
  }
  function bindIndicatorNav() {
    document.querySelectorAll(".spine-indicator__node").forEach((node) => {
      const targetId = node.dataset.target;
      const dot = node.querySelector(".spine-indicator__dot");
      dot == null ? void 0 : dot.addEventListener("click", () => {
        if (node.dataset.locked === "true") return;
        const target = document.getElementById(targetId);
        if (target) scrollTo(target, { offset: -40 });
      });
    });
  }
  function bindBranchTriggerButtons() {
    document.querySelectorAll(".branch-node__enter").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const branchId = btn.dataset.branch;
        onBranchActivate == null ? void 0 : onBranchActivate(branchId);
      });
    });
  }
  function bindLockGate() {
    const sync = (unlocked) => {
      const beatSection = document.querySelector("#beat-codigo");
      const branchNode = beatSection == null ? void 0 : beatSection.querySelector(".branch-node--lockable");
      const enterBtn = beatSection == null ? void 0 : beatSection.querySelector(".branch-node__enter--locked");
      const lockMsg = document.querySelector("#archivo-lock-msg p");
      const previewDials = beatSection == null ? void 0 : beatSection.querySelectorAll(".lock-preview__dial");
      const indicatorNode = document.querySelector(".spine-indicator__node--lock");
      const COMBINATION2 = ["1", "9", "6", "2", "4", "7"];
      const reduced = state.get("reducedMotion");
      if (unlocked && (previewDials == null ? void 0 : previewDials.length)) {
        if (reduced) {
          previewDials.forEach((dial, i) => {
            dial.textContent = COMBINATION2[i];
          });
        } else if (typeof window.gsap !== "undefined") {
          gsap.to(previewDials, {
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            onStart: () => {
              previewDials.forEach((dial, i) => {
                dial.textContent = COMBINATION2[i];
              });
            }
          });
        }
      }
      if (lockMsg) {
        lockMsg.textContent = unlocked ? "El c\xF3digo est\xE1 completo." : "Faltan testimonios por reconstruir.";
      }
      if (enterBtn) {
        enterBtn.disabled = false;
        enterBtn.setAttribute("aria-disabled", String(!unlocked));
        enterBtn.setAttribute(
          "aria-label",
          unlocked ? "Abrir el compartimento de la c\xE1mara" : "Compartimento bloqueado: faltan testimonios por reconstruir"
        );
      }
      beatSection == null ? void 0 : beatSection.setAttribute("data-locked", String(!unlocked));
      branchNode == null ? void 0 : branchNode.setAttribute("data-locked", String(!unlocked));
      indicatorNode == null ? void 0 : indicatorNode.setAttribute("data-locked", String(!unlocked));
    };
    state.on("archiveUnlocked", sync);
    sync(state.get("archiveUnlocked"));
  }
  function bindContactSheetFlip() {
    document.querySelectorAll(".contact-frame__flip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const frame = btn.closest(".contact-frame");
        const isFlipped = frame.classList.toggle("is-flipped");
        btn.setAttribute("aria-pressed", String(isFlipped));
        const back = frame.querySelector(".contact-frame__face--back");
        back == null ? void 0 : back.setAttribute("aria-hidden", String(!isFlipped));
        btn.textContent = isFlipped ? "Anverso" : "Reverso";
      });
    });
  }
  function bindInstagramThumbs() {
    const PHOTO_MAP = {
      ernesto: "assets/images/contact-sheet/ernesto-anverso.jpg",
      lucia: "assets/images/contact-sheet/lucia-anverso.jpg",
      quispe: "assets/images/contact-sheet/quispe-anverso.jpg"
    };
    document.querySelectorAll(".instagram-thumb").forEach((thumb) => {
      const key = thumb.dataset.photo;
      const src = PHOTO_MAP[key];
      if (!src) return;
      thumb.style.backgroundImage = `url('${src}')`;
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
    });
  }
  function refreshScrollTriggers() {
    if (typeof window.ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  }

  // js/data/transcript.js
  var TRANSCRIPT = [
    {
      startTime: 0,
      endTime: 6.2,
      encounter: 1,
      speaker: "ernesto",
      text: "S\xED, soy yo. Hace a\xF1os de esto. Ni sab\xEDa que exist\xEDa esta foto.",
      marginNote: null,
      isKeyMoment: false
    },
    {
      startTime: 6.2,
      endTime: 15.5,
      encounter: 1,
      speaker: "ernesto",
      text: "No recuerdo haberle entregado ninguna c\xE1mara a nadie. Pero s\xED conoc\xED a alguien que andaba por aqu\xED con un equipo antiguo.",
      marginNote: null,
      isKeyMoment: false
    },
    {
      startTime: 15.5,
      endTime: 24,
      encounter: 1,
      speaker: "ernesto",
      text: "Gabriel Medina. No buscaba edificios famosos. Le interesaba lo que estaba a punto de desaparecer.",
      marginNote: {
        text: "Por primera vez, la c\xE1mara tiene un nombre detr\xE1s."
      },
      isKeyMoment: false
    },
    {
      startTime: 24,
      endTime: 32.8,
      encounter: 2,
      speaker: "ernesto",
      text: "A veces volv\xEDa meses despu\xE9s. Dec\xEDa que una imagen sin la historia de quien aparece en ella estaba incompleta.",
      marginNote: null,
      isKeyMoment: false
    },
    {
      startTime: 32.8,
      endTime: 45.6,
      encounter: 2,
      speaker: "ernesto",
      text: "Busqu\xE9 entre mis cosas y encontr\xE9 esta copia. Es la misma fotograf\xEDa, pero mire el reverso: tiene un n\xFAmero que en la suya no aparece.",
      marginNote: {
        text: "Una segunda copia de la misma imagen, con una anotaci\xF3n distinta."
      },
      isKeyMoment: true
    },
    {
      startTime: 45.6,
      endTime: 55,
      encounter: 2,
      speaker: "ernesto",
      text: "No s\xE9 qu\xE9 significa. La guard\xE9 con otros papeles de esa \xE9poca, sin pensar que alguien volver\xEDa a preguntar por ella.",
      marginNote: null,
      isKeyMoment: false
    },
    {
      startTime: 55,
      endTime: 65,
      encounter: 2,
      speaker: "ernesto",
      text: "Gabriel conoci\xF3 a mucha gente por estas calles. Si quiere entender lo que estaba haciendo, tendr\xEDa que escuchar tambi\xE9n a los dem\xE1s.",
      marginNote: null,
      isKeyMoment: false
    }
  ];
  var TOTAL_DURATION = 65;
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // js/branches/podcast.js?v=ernesto-sync-2
  var AUDIO_SRC = "assets/audio/entrevista-ernesto.mp3";
  var TOTAL_DURATION_FALLBACK = 65;
  var ENCOUNTER_LABELS = {
    1: "Primer encuentro \xB7 El reconocimiento",
    2: "Segunda visita \xB7 La caja"
  };
  var audioEl;
  var playBtn;
  var scrubber;
  var fillEl;
  var timeEl;
  var transcriptEl;
  var waveformEl;
  var controlsEl;
  var durationEl;
  var evidenceEl;
  var liveStatusEl;
  var rafId = null;
  var onCompleteCallback = null;
  var keyMomentTriggered = false;
  var activeTranscriptIndex = -1;
  var desiredPlaybackTime = 0;
  var listenersBound = false;
  function initPodcast(asideEl, { onComplete } = {}) {
    var _a2;
    onCompleteCallback = onComplete;
    keyMomentTriggered = false;
    audioEl = asideEl.querySelector("#podcast-audio");
    playBtn = asideEl.querySelector("#podcast-play");
    scrubber = asideEl.querySelector("#podcast-scrubber");
    fillEl = asideEl.querySelector(".podcast-controls__fill");
    timeEl = asideEl.querySelector("#podcast-time");
    transcriptEl = asideEl.querySelector("#podcast-transcript");
    waveformEl = asideEl.querySelector("#podcast-waveform");
    controlsEl = asideEl.querySelector(".podcast-controls");
    durationEl = asideEl.querySelector(".podcast-controls__duration");
    evidenceEl = asideEl.querySelector("#evidence-196");
    liveStatusEl = asideEl.querySelector("#podcast-live-status");
    activeTranscriptIndex = -1;
    desiredPlaybackTime = 0;
    audioEl.preload = "auto";
    audioEl.src = AUDIO_SRC;
    audioEl.load();
    const evidenceAlreadyFound = state.get("evidence").ernesto196;
    evidenceEl.hidden = !evidenceAlreadyFound;
    evidenceEl.setAttribute("aria-hidden", String(!evidenceAlreadyFound));
    evidenceEl.classList.toggle("is-revealed", evidenceAlreadyFound);
    buildTranscript();
    buildWaveform();
    activeTranscriptIndex = 0;
    updateUI(0, TOTAL_DURATION_FALLBACK);
    activeTranscriptIndex = -1;
    if (evidenceAlreadyFound) {
      (_a2 = waveformEl.querySelector(".waveform-marker")) == null ? void 0 : _a2.classList.add("is-visible");
    }
    if (!listenersBound) {
      bindControls();
      listenersBound = true;
    }
  }
  function destroyPodcast(asideEl) {
    audioEl == null ? void 0 : audioEl.pause();
    cancelAnimationFrame(rafId);
    rafId = null;
    if (playBtn) {
      playBtn.dataset.state = "paused";
      if (!playBtn.disabled) playBtn.setAttribute("aria-label", "Reproducir");
    }
  }
  function buildTranscript() {
    transcriptEl.innerHTML = "";
    let currentEncounter = null;
    TRANSCRIPT.forEach((line, i) => {
      if (line.encounter !== currentEncounter) {
        currentEncounter = line.encounter;
        const divider = document.createElement("p");
        divider.className = "transcript-encounter archive-label";
        divider.textContent = ENCOUNTER_LABELS[currentEncounter] || `Encuentro ${currentEncounter}`;
        transcriptEl.appendChild(divider);
      }
      const lineEl = document.createElement("div");
      lineEl.className = "transcript-line";
      lineEl.setAttribute("role", "button");
      lineEl.setAttribute("tabindex", "0");
      lineEl.dataset.start = line.startTime;
      lineEl.dataset.end = line.endTime;
      lineEl.dataset.index = String(i);
      lineEl.setAttribute(
        "aria-label",
        `Escuchar desde ${formatTime(line.startTime)}. Don Ernesto: ${line.text}`
      );
      if (line.isKeyMoment) lineEl.dataset.keyMoment = "true";
      const timeBadge = document.createElement("span");
      timeBadge.className = "transcript-line__time";
      timeBadge.setAttribute("aria-hidden", "true");
      timeBadge.textContent = formatTime(line.startTime);
      const textEl = document.createElement("p");
      textEl.className = "transcript-line__text";
      const speaker = document.createElement("span");
      speaker.className = "sr-only";
      speaker.textContent = "Don Ernesto: ";
      textEl.append(speaker, document.createTextNode(line.text));
      lineEl.append(timeBadge, textEl);
      if (line.marginNote) {
        const note = document.createElement("aside");
        note.className = "transcript-note";
        note.setAttribute("aria-label", "Nota de Valeria");
        const noteText = document.createElement("p");
        noteText.className = "transcript-note__text handwriting";
        noteText.textContent = line.marginNote.text;
        note.appendChild(noteText);
        lineEl.appendChild(note);
      }
      transcriptEl.appendChild(lineEl);
    });
    transcriptEl.querySelectorAll(".transcript-line").forEach((lineEl) => {
      lineEl.addEventListener("click", () => seekToTranscriptLine(lineEl));
      lineEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        seekToTranscriptLine(lineEl);
      });
    });
  }
  function seekToTranscriptLine(lineEl) {
    var _a2;
    if (!audioEl || !lineEl) return;
    const transcriptStart = Number.parseFloat(lineEl.dataset.start || "0");
    const knownDuration = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : TOTAL_DURATION_FALLBACK;
    const targetTime = Math.min(knownDuration, Math.max(0, transcriptStart));
    desiredPlaybackTime = targetTime;
    cancelAnimationFrame(rafId);
    rafId = null;
    try {
      audioEl.currentTime = targetTime;
    } catch {
      audioEl.addEventListener("loadedmetadata", () => {
        audioEl.currentTime = targetTime;
      }, { once: true });
      audioEl.load();
    }
    updateUI(targetTime, knownDuration);
    updateTranscriptHighlight(transcriptStart);
    if (liveStatusEl) {
      const selectedText = ((_a2 = lineEl.querySelector(".transcript-line__text")) == null ? void 0 : _a2.textContent) || "";
      liveStatusEl.textContent = `Reproduciendo desde ${formatTime(transcriptStart)}. ${selectedText}`;
    }
    const playRequest = audioEl.play();
    playBtn.dataset.state = "playing";
    playBtn.setAttribute("aria-label", "Pausar");
    startProgressLoop();
    if (playRequest && typeof playRequest.catch === "function") {
      playRequest.catch(() => {
        playBtn.dataset.state = "paused";
        playBtn.setAttribute("aria-label", "Reproducir");
        cancelAnimationFrame(rafId);
        rafId = null;
        playBtn == null ? void 0 : playBtn.focus();
      });
    }
  }
  function seekAudioTo(targetTime) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        audioEl.removeEventListener("seeked", finish);
        audioEl.removeEventListener("timeupdate", verify);
        window.clearTimeout(timer);
        resolve();
      };
      const verify = () => {
        if (Math.abs(audioEl.currentTime - targetTime) < 0.45) finish();
      };
      const timer = window.setTimeout(() => {
        if (Math.abs(audioEl.currentTime - targetTime) > 0.75) {
          audioEl.currentTime = targetTime;
        }
        finish();
      }, 450);
      audioEl.addEventListener("seeked", finish, { once: true });
      audioEl.addEventListener("timeupdate", verify);
      try {
        audioEl.currentTime = targetTime;
      } catch {
        finish();
      }
    });
  }
  function playFromCurrentPosition(expectedStart = null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    const startAt = Number.isFinite(expectedStart) ? expectedStart : desiredPlaybackTime;
    seekAudioTo(startAt).then(() => audioEl.play()).then(() => {
      playBtn.dataset.state = "playing";
      playBtn.setAttribute("aria-label", "Pausar");
      startProgressLoop();
    }).catch(() => {
      playBtn == null ? void 0 : playBtn.focus();
    });
  }
  function getAudioDuration() {
    return Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : TOTAL_DURATION_FALLBACK;
  }
  function updateTranscriptHighlight(currentTime) {
    const lines = transcriptEl.querySelectorAll(".transcript-line");
    lines.forEach((lineEl, index) => {
      const start = parseFloat(lineEl.dataset.start);
      const end = parseFloat(lineEl.dataset.end);
      const isActive = currentTime >= start && currentTime < end;
      const isPast = currentTime >= end;
      lineEl.classList.toggle("is-active", isActive);
      lineEl.classList.toggle("is-past", isPast && !isActive);
      if (isActive) {
        lineEl.setAttribute("aria-current", "true");
      } else {
        lineEl.removeAttribute("aria-current");
      }
      if (isActive && activeTranscriptIndex !== index) {
        activeTranscriptIndex = index;
        const line = TRANSCRIPT[index];
        if (liveStatusEl) liveStatusEl.textContent = `Don Ernesto: ${line.text}`;
        lineEl.scrollIntoView({
          block: "nearest",
          behavior: state.get("reducedMotion") ? "auto" : "smooth"
        });
      }
      if (isActive && lineEl.dataset.keyMoment === "true" && !keyMomentTriggered) {
        keyMomentTriggered = true;
        triggerKeyMoment();
      }
    });
  }
  function triggerKeyMoment() {
    const evidenceAlreadyFound = state.get("evidence").ernesto196;
    keyMomentTriggered = true;
    evidenceEl.hidden = false;
    evidenceEl.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      evidenceEl.classList.add("is-revealed");
    });
    const marker = waveformEl.querySelector(".waveform-marker");
    marker == null ? void 0 : marker.classList.add("is-visible");
    state.recordEvidence("ernesto196");
    if (liveStatusEl) {
      liveStatusEl.textContent = "Evidencia registrada: la segunda copia contiene el n\xFAmero 196.";
    }
    if (!evidenceAlreadyFound) onCompleteCallback == null ? void 0 : onCompleteCallback();
  }
  function buildWaveform() {
    const width = 600;
    const height = 64;
    const points = 120;
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const pathPoints = [];
    for (let i = 0; i <= points; i++) {
      const x = i / points * width;
      const amplitude = 8 + pseudoRandom() * 20;
      const wobble = Math.sin(i * 0.5) * 4;
      const y = height / 2 + (pseudoRandom() > 0.5 ? 1 : -1) * (amplitude + wobble);
      pathPoints.push([x, y]);
    }
    const pathD = pathPoints.map(
      (p, i) => i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`
    ).join(" ");
    const markerPercent = 32.8 / TOTAL_DURATION * 100;
    waveformEl.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <path class="waveform-track" d="${pathD}" />
      <path class="waveform-progress" d="${pathD}" />
    </svg>
    <div class="waveform-marker" style="left:${markerPercent}%"></div>
  `;
  }
  function updateWaveformProgress(fraction) {
    const progressPath = waveformEl.querySelector(".waveform-progress");
    if (progressPath) {
      progressPath.style.clipPath = `inset(0 ${100 - fraction * 100}% 0 0)`;
    }
  }
  function bindControls() {
    playBtn.addEventListener("click", togglePlay);
    scrubber.addEventListener("input", () => {
      const duration = getAudioDuration();
      const time = scrubber.value / 100 * duration;
      desiredPlaybackTime = time;
      seekAudioTo(time);
      updateUI(time, duration);
    });
    audioEl.addEventListener("loadedmetadata", () => {
      const duration = getAudioDuration();
      if (desiredPlaybackTime > 0) {
        seekAudioTo(desiredPlaybackTime);
      }
      updateUI(desiredPlaybackTime, duration);
      if (durationEl) durationEl.textContent = `/ ${formatTime(audioEl.duration)}`;
    });
    audioEl.addEventListener("ended", () => {
      desiredPlaybackTime = 0;
      playBtn.dataset.state = "paused";
      playBtn.setAttribute("aria-label", "Reproducir");
      updateUI(audioEl.duration, audioEl.duration);
    });
    audioEl.addEventListener("error", showAudioFallback);
  }
  function togglePlay() {
    if (audioEl.paused) {
      playFromCurrentPosition(desiredPlaybackTime);
    } else {
      audioEl.pause();
      playBtn.dataset.state = "paused";
      playBtn.setAttribute("aria-label", "Reproducir");
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  function showAudioFallback() {
    var _a2;
    playBtn.disabled = true;
    playBtn.setAttribute("aria-disabled", "true");
    playBtn.setAttribute("aria-label", "Recreaci\xF3n sonora pendiente");
    scrubber.disabled = true;
    scrubber.setAttribute("aria-disabled", "true");
    waveformEl.classList.add("is-unavailable");
    transcriptEl.classList.add("is-static");
    const container = playBtn.closest(".podcast-player") || playBtn.parentElement;
    const existingNotice = container == null ? void 0 : container.querySelector(".asset-notice");
    if (!container || existingNotice) return;
    const notice = document.createElement("div");
    notice.className = "asset-notice";
    notice.setAttribute("role", "status");
    notice.innerHTML = `
    <p><strong>Recreaci\xF3n sonora pendiente.</strong> La transcripci\xF3n completa de los dos encuentros permanece disponible.</p>
    <button type="button" class="asset-notice__continue">
      Confirmar la evidencia descrita
    </button>
  `;
    (_a2 = notice.querySelector("button")) == null ? void 0 : _a2.addEventListener("click", continueFromTranscript);
    controlsEl == null ? void 0 : controlsEl.insertAdjacentElement("afterend", notice);
  }
  function continueFromTranscript() {
    triggerKeyMoment();
    evidenceEl.scrollIntoView({
      block: "center",
      behavior: state.get("reducedMotion") ? "auto" : "smooth"
    });
  }
  function startProgressLoop() {
    const tick = () => {
      if (audioEl.paused) return;
      const duration = getAudioDuration();
      desiredPlaybackTime = audioEl.currentTime;
      updateUI(audioEl.currentTime, duration);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }
  function updateUI(currentTime, duration) {
    const fraction = duration ? currentTime / duration : 0;
    scrubber.value = fraction * 100;
    scrubber.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
    scrubber.setAttribute("aria-valuetext", `${Math.round(fraction * 100)}%`);
    fillEl.style.width = `${fraction * 100}%`;
    timeEl.textContent = formatTime(currentTime);
    timeEl.setAttribute("datetime", `PT${Math.floor(currentTime)}S`);
    updateWaveformProgress(fraction);
    const transcriptTime = duration ? currentTime * (TOTAL_DURATION / duration) : currentTime;
    updateTranscriptHighlight(Math.min(transcriptTime, TOTAL_DURATION));
  }

  // js/data/map-points.js
  var MAP_POINTS = [
    {
      id: "ernesto-huanca",
      svgCoords: { x: 0.42, y: 0.31 },
      address: "Centro Hist\xF3rico de Lima",
      person: "Don Ernesto Huanca",
      occupation: null,
      caption: "Reconocido en la primera fotograf\xEDa. El primer rostro identificado.",
      photo: "assets/images/contact-sheet/ernesto-anverso.jpg",
      revealOrder: 1,
      threatened: true,
      linkedBranch: "podcast"
    },
    {
      id: "lucia-mural",
      svgCoords: { x: 0.58, y: 0.44 },
      address: "Centro Hist\xF3rico de Lima",
      person: "Luc\xEDa Fern\xE1ndez",
      occupation: "Artista urbana",
      caption: "El mural que pint\xF3 en un proyecto de arte comunitario.",
      photo: "assets/images/contact-sheet/lucia-anverso.jpg",
      revealOrder: 2,
      threatened: true,
      linkedBranch: "mapa"
    },
    {
      id: "quispe-vivienda",
      svgCoords: { x: 0.51, y: 0.58 },
      address: "Centro Hist\xF3rico de Lima",
      person: "Familia Quispe",
      occupation: "Vivienda familiar",
      caption: "La casa donde crecieron varias generaciones de la familia.",
      photo: "assets/images/contact-sheet/quispe-anverso.jpg",
      revealOrder: 3,
      threatened: true,
      linkedBranch: "video"
    },
    {
      id: "ultima-memoria",
      svgCoords: { x: 0.29, y: 0.67 },
      address: null,
      // Deliberadamente vacío en la libreta
      person: null,
      // Sin nombre asignado
      occupation: null,
      caption: null,
      photo: null,
      revealOrder: 6,
      threatened: false,
      linkedBranch: null,
      isEndPoint: true
      // El punto que activa el desenlace
    }
  ];
  var POINTS_BY_ID = Object.fromEntries(
    MAP_POINTS.map((p) => [p.id, p])
  );

  // js/branches/mapa.js
  var surfaceEl;
  var pointsContainer;
  var detailEl;
  var countEl;
  var evidenceEl2;
  var onCompleteCallback2 = null;
  var interactedPoints = /* @__PURE__ */ new Set();
  var evidenceTriggered = false;
  var requiredPointCount = 0;
  var loadRafId = null;
  var detailFocusRafId = null;
  var revealTimers = [];
  function initMapa(asideEl, { onComplete } = {}) {
    onCompleteCallback2 = onComplete;
    surfaceEl = asideEl.querySelector(".mapa-canvas__surface");
    pointsContainer = asideEl.querySelector(".mapa-points");
    detailEl = asideEl.querySelector("#mapa-detail");
    countEl = asideEl.querySelector("#mapa-verified");
    evidenceEl2 = asideEl.querySelector("#evidence-247-mapa");
    requiredPointCount = pointsContainer.querySelectorAll(".mapa-point").length;
    const evidenceAlreadyFound = state.get("evidence").lucia247;
    evidenceTriggered || (evidenceTriggered = evidenceAlreadyFound);
    evidenceEl2.hidden = !evidenceAlreadyFound;
    evidenceEl2.setAttribute("aria-hidden", String(!evidenceAlreadyFound));
    evidenceEl2.classList.toggle("is-revealed", evidenceAlreadyFound);
    updateCounter();
    revealPointsSequentially();
    bindPointInteractions();
    bindDetailClose();
    loadRafId = requestAnimationFrame(() => {
      surfaceEl.classList.add("is-loaded");
    });
  }
  function destroyMapa(asideEl) {
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    cancelAnimationFrame(loadRafId);
    loadRafId = null;
    cancelAnimationFrame(detailFocusRafId);
    detailFocusRafId = null;
    closeDetail({ restoreFocus: false });
    const photoEl = detailEl == null ? void 0 : detailEl.querySelector(".mapa-detail__photo");
    if (photoEl) {
      photoEl.onload = null;
      photoEl.onerror = null;
      if (typeof window.gsap !== "undefined") gsap.killTweensOf(photoEl);
    }
  }
  function revealPointsSequentially() {
    const visiblePoints = pointsContainer.querySelectorAll(".mapa-point");
    visiblePoints.forEach((point, i) => {
      const delay = state.get("reducedMotion") ? 0 : i * 0.35;
      const timer = setTimeout(() => {
        point.classList.add("is-visible");
      }, delay * 1e3);
      revealTimers.push(timer);
    });
  }
  function bindPointInteractions() {
    pointsContainer.querySelectorAll(".mapa-point").forEach((point) => {
      if (point.dataset.mapaBound === "true") return;
      point.dataset.mapaBound = "true";
      point.setAttribute("aria-pressed", "false");
      point.addEventListener("click", () => {
        const pointId = point.dataset.pointId;
        const data = MAP_POINTS.find((p) => p.id === pointId);
        if (!data) return;
        pointsContainer.querySelectorAll(".mapa-point.is-active").forEach((p) => {
          p.classList.remove("is-active");
          p.setAttribute("aria-pressed", "false");
        });
        point.classList.add("is-active");
        point.setAttribute("aria-pressed", "true");
        showDetail(data);
        if (!interactedPoints.has(pointId)) {
          interactedPoints.add(pointId);
          updateCounter();
        }
        if (interactedPoints.size >= requiredPointCount && !evidenceTriggered) {
          evidenceTriggered = true;
          revealMapEvidence();
          onCompleteCallback2 == null ? void 0 : onCompleteCallback2();
        }
      });
    });
  }
  function revealMapEvidence() {
    if (!evidenceEl2) return;
    evidenceEl2.hidden = false;
    evidenceEl2.removeAttribute("aria-hidden");
    requestAnimationFrame(() => {
      evidenceEl2.classList.add("is-revealed");
    });
    state.recordEvidence("lucia247");
  }
  function showDetail(data) {
    detailEl.hidden = false;
    detailEl.classList.add("is-active");
    detailEl.classList.toggle("is-unnamed", !data.person);
    const photoEl = detailEl.querySelector(".mapa-detail__photo");
    const photoStatusEl = detailEl.querySelector(".mapa-detail__photo-status");
    const personEl = detailEl.querySelector(".mapa-detail__person");
    const occEl = detailEl.querySelector(".mapa-detail__occupation");
    const addrEl = detailEl.querySelector(".mapa-detail__address");
    const capEl = detailEl.querySelector(".mapa-detail__caption");
    if (data.photo) {
      let settled = false;
      const showLoadedPhoto = () => {
        if (settled) return;
        settled = true;
        photoEl.hidden = false;
        photoEl.classList.remove("asset-missing", "is-revealed");
        if (photoStatusEl) photoStatusEl.hidden = true;
        revealElement(photoEl, { delay: 0.1 });
      };
      const showPhotoFallback = () => {
        if (settled) return;
        settled = true;
        photoEl.hidden = true;
        photoEl.classList.add("asset-missing");
        if (photoStatusEl) {
          photoStatusEl.hidden = false;
          photoStatusEl.textContent = "La imagen no aparece, pero el recuerdo sigue marcado en el mapa.";
        }
      };
      photoEl.onload = showLoadedPhoto;
      photoEl.onerror = showPhotoFallback;
      photoEl.alt = data.occupation ? `Fotograf\xEDa de ${data.person}, ${data.occupation}` : `Fotograf\xEDa de ${data.person}`;
      photoEl.hidden = false;
      if (photoStatusEl) photoStatusEl.hidden = true;
      photoEl.src = data.photo;
      if (photoEl.complete) {
        if (photoEl.naturalWidth > 0) showLoadedPhoto();
        else showPhotoFallback();
      }
    } else {
      photoEl.hidden = true;
      if (photoStatusEl) {
        photoStatusEl.hidden = false;
        photoStatusEl.textContent = "Este punto qued\xF3 sin fotograf\xEDa.";
      }
    }
    personEl.textContent = data.person || "Sin identificar todav\xEDa";
    occEl.textContent = data.occupation || "";
    addrEl.textContent = data.address || "";
    capEl.textContent = data.caption || "";
  }
  function bindDetailClose() {
    const closeBtn = detailEl.querySelector(".mapa-detail__close");
    if (!closeBtn || closeBtn.dataset.mapaBound === "true") return;
    closeBtn.dataset.mapaBound = "true";
    closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeDetail();
    });
  }
  function closeDetail({ restoreFocus = true } = {}) {
    if (!detailEl) return;
    let lastActive = null;
    pointsContainer == null ? void 0 : pointsContainer.querySelectorAll(".mapa-point.is-active").forEach((point) => {
      point.classList.remove("is-active");
      point.setAttribute("aria-pressed", "false");
      lastActive = point;
    });
    detailEl.classList.remove("is-active");
    detailEl.hidden = true;
    cancelAnimationFrame(detailFocusRafId);
    detailFocusRafId = null;
    if (restoreFocus && lastActive) {
      detailFocusRafId = requestAnimationFrame(() => {
        if (detailEl == null ? void 0 : detailEl.hidden) lastActive.focus({ preventScroll: true });
        detailFocusRafId = null;
      });
    }
  }
  function updateCounter() {
    if (countEl) countEl.textContent = String(interactedPoints.size);
  }

  // js/branches/video.js
  var VIDEO_SRC = "assets/video/quispe-sobre.mp4";
  var CAPTIONS_SRC = "assets/video/quispe-sobre.vtt";
  var videoEl;
  var captionsEl;
  var statusEl;
  var reviewBtn;
  var evidenceEl3;
  var onCompleteCallback3 = null;
  var revealRafId = null;
  var resourceIssues = /* @__PURE__ */ new Set();
  function initVideo(asideEl, { onComplete } = {}) {
    onCompleteCallback3 = onComplete;
    videoEl = asideEl.querySelector("#quispe-video");
    captionsEl = asideEl.querySelector("#quispe-captions");
    statusEl = asideEl.querySelector("#video-resource-status");
    reviewBtn = asideEl.querySelector("#video-evidence-review");
    evidenceEl3 = asideEl.querySelector("#evidence-247-confirm");
    bindInteractions();
    syncEvidence();
    loadResources();
  }
  function destroyVideo() {
    cancelAnimationFrame(revealRafId);
    revealRafId = null;
    if (videoEl) {
      videoEl.pause();
      if (Number.isFinite(videoEl.duration)) videoEl.currentTime = 0;
    }
  }
  function bindInteractions() {
    if ((reviewBtn == null ? void 0 : reviewBtn.dataset.videoBound) !== "true") {
      reviewBtn.dataset.videoBound = "true";
      reviewBtn.addEventListener("click", revealEvidence);
    }
    if ((videoEl == null ? void 0 : videoEl.dataset.videoBound) !== "true") {
      videoEl.dataset.videoBound = "true";
      videoEl.addEventListener("loadedmetadata", handleVideoReady);
      videoEl.addEventListener("error", handleVideoError);
    }
    if ((captionsEl == null ? void 0 : captionsEl.dataset.videoBound) !== "true") {
      captionsEl.dataset.videoBound = "true";
      captionsEl.addEventListener("load", handleCaptionsReady);
      captionsEl.addEventListener("error", handleCaptionsError);
    }
  }
  function loadResources() {
    resourceIssues = /* @__PURE__ */ new Set();
    renderResourceStatus();
    videoEl.hidden = false;
    videoEl.removeAttribute("aria-hidden");
    videoEl.preload = "metadata";
    if (videoEl.getAttribute("src") !== VIDEO_SRC) videoEl.src = VIDEO_SRC;
    if (captionsEl.getAttribute("src") !== CAPTIONS_SRC) captionsEl.src = CAPTIONS_SRC;
    videoEl.load();
  }
  function handleVideoReady() {
    resourceIssues.delete("video");
    videoEl.hidden = false;
    videoEl.removeAttribute("aria-hidden");
    renderResourceStatus();
  }
  function handleVideoError() {
    resourceIssues.add("video");
    videoEl.hidden = true;
    videoEl.setAttribute("aria-hidden", "true");
    renderResourceStatus();
  }
  function handleCaptionsReady() {
    resourceIssues.delete("captions");
    renderResourceStatus();
  }
  function handleCaptionsError() {
    resourceIssues.add("captions");
    renderResourceStatus();
  }
  function renderResourceStatus() {
    if (!statusEl) return;
    if (resourceIssues.has("video")) {
      statusEl.textContent = "El video no aparece. El sobre y la hoja todav\xEDa pueden revisarse.";
      statusEl.hidden = false;
      return;
    }
    if (resourceIssues.has("captions")) {
      statusEl.textContent = "Los subt\xEDtulos no aparecen. La escena tambi\xE9n queda descrita junto al documento.";
      statusEl.hidden = false;
      return;
    }
    statusEl.textContent = "";
    statusEl.hidden = true;
  }
  function syncEvidence() {
    const evidenceAlreadyFound = state.get("evidence").quispe247Confirmed;
    evidenceEl3.hidden = !evidenceAlreadyFound;
    evidenceEl3.setAttribute("aria-hidden", String(!evidenceAlreadyFound));
    evidenceEl3.classList.toggle("is-revealed", evidenceAlreadyFound);
    reviewBtn.setAttribute("aria-expanded", String(evidenceAlreadyFound));
    reviewBtn.textContent = evidenceAlreadyFound ? "Volver a examinar la hoja" : "Examinar la hoja";
  }
  function revealEvidence() {
    const evidenceAlreadyFound = state.get("evidence").quispe247Confirmed;
    evidenceEl3.hidden = false;
    evidenceEl3.setAttribute("aria-hidden", "false");
    reviewBtn.setAttribute("aria-expanded", "true");
    reviewBtn.textContent = "Volver a examinar la hoja";
    cancelAnimationFrame(revealRafId);
    revealRafId = requestAnimationFrame(() => {
      evidenceEl3.classList.add("is-revealed");
      evidenceEl3.focus({ preventScroll: false });
      revealRafId = null;
    });
    state.recordEvidence("quispe247Confirmed");
    if (!evidenceAlreadyFound) onCompleteCallback3 == null ? void 0 : onCompleteCallback3();
  }

  // js/branches/libreta.js
  var coverEl;
  var openBtn;
  var bodyEl;
  var navEl;
  var prevBtn;
  var nextBtn;
  var pageLabel;
  var counterEl;
  var reviewBtn2;
  var revelationEl;
  var mapImage;
  var mapStatus;
  var spreads = [];
  var currentIndex = 0;
  var coverOpened = false;
  var coverOpening = false;
  var pointReviewed = false;
  var listenersBound2 = false;
  var onCompleteCallback4 = null;
  function initLibreta(asideEl, { onComplete } = {}) {
    var _a2;
    onCompleteCallback4 = onComplete;
    coverEl = asideEl.querySelector("#notebook-cover");
    openBtn = asideEl.querySelector("#notebook-open-btn");
    bodyEl = asideEl.querySelector("#notebook-body");
    navEl = asideEl.querySelector(".notebook-nav");
    prevBtn = asideEl.querySelector("#notebook-prev");
    nextBtn = asideEl.querySelector("#notebook-next");
    pageLabel = asideEl.querySelector("#notebook-page-label");
    counterEl = asideEl.querySelector("#notebook-counter");
    reviewBtn2 = asideEl.querySelector("#notebook-review-point");
    revelationEl = asideEl.querySelector("#notebook-map-revelation");
    mapImage = asideEl.querySelector("#notebook-map-image");
    mapStatus = asideEl.querySelector("#notebook-map-status");
    spreads = [...asideEl.querySelectorAll(".notebook-spread")];
    pointReviewed = Boolean(
      pointReviewed || ((_a2 = state.get("completedBranches")) == null ? void 0 : _a2.has("libreta"))
    );
    if (!listenersBound2) {
      bindInteractions2();
      listenersBound2 = true;
    }
    syncView();
  }
  function destroyLibreta() {
    if (typeof window.gsap !== "undefined") {
      window.gsap.killTweensOf([coverEl, bodyEl, ...spreads]);
    }
    if (coverOpening && !coverOpened) {
      coverOpening = false;
      resetAnimatedStyles(coverEl);
      if (coverEl) coverEl.hidden = false;
      if (bodyEl) bodyEl.hidden = true;
      if (navEl) navEl.hidden = true;
    }
    spreads.forEach(resetAnimatedStyles);
  }
  function bindInteractions2() {
    openBtn == null ? void 0 : openBtn.addEventListener("click", openCover);
    prevBtn == null ? void 0 : prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
    nextBtn == null ? void 0 : nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
    reviewBtn2 == null ? void 0 : reviewBtn2.addEventListener("click", reviewUnnamedPoint);
    mapImage == null ? void 0 : mapImage.addEventListener("load", handleMapLoad);
    mapImage == null ? void 0 : mapImage.addEventListener("error", handleMapError);
  }
  function syncView() {
    coverEl.hidden = coverOpened;
    bodyEl.hidden = !coverOpened;
    navEl.hidden = !coverOpened;
    counterEl.textContent = coverOpened ? `Doble p\xE1gina ${currentIndex + 1} de ${spreads.length}` : "Portada";
    showSpread(currentIndex, { animate: false });
    syncReviewState();
    if (coverOpened && currentIndex >= getMapSpreadIndex()) {
      loadMapResource();
    }
  }
  function openCover() {
    if (coverOpened || coverOpening) return;
    coverOpening = true;
    if (!canAnimate()) {
      finishCoverOpening();
      return;
    }
    window.gsap.to(coverEl, {
      opacity: 0,
      scale: 0.98,
      duration: 0.45,
      ease: "power2.inOut",
      onComplete: finishCoverOpening
    });
  }
  function finishCoverOpening() {
    coverOpening = false;
    coverOpened = true;
    resetAnimatedStyles(coverEl);
    coverEl.hidden = true;
    bodyEl.hidden = false;
    navEl.hidden = false;
    showSpread(currentIndex, { animate: false });
    nextBtn == null ? void 0 : nextBtn.focus();
  }
  function goTo(index) {
    if (index < 0 || index >= spreads.length || index === currentIndex) return;
    const direction = index > currentIndex ? 1 : -1;
    currentIndex = index;
    showSpread(index, { animate: true, direction });
    if (index >= getMapSpreadIndex()) {
      loadMapResource();
    }
    if (index === getReviewSpreadIndex()) {
      reviewBtn2 == null ? void 0 : reviewBtn2.focus();
    } else {
      nextBtn == null ? void 0 : nextBtn.focus();
    }
  }
  function showSpread(index, { animate = true, direction = 1 } = {}) {
    spreads.forEach((spread, spreadIndex) => {
      if (typeof window.gsap !== "undefined") window.gsap.killTweensOf(spread);
      resetAnimatedStyles(spread);
      spread.hidden = spreadIndex !== index;
    });
    const current = spreads[index];
    if (animate && current && canAnimate()) {
      window.gsap.fromTo(
        current,
        { opacity: 0, x: direction * 18 },
        { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
      );
    }
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === spreads.length - 1;
    pageLabel.textContent = `Doble p\xE1gina ${index + 1} de ${spreads.length}`;
    if (coverOpened) {
      counterEl.textContent = `Doble p\xE1gina ${index + 1} de ${spreads.length}`;
    }
  }
  function loadMapResource() {
    if (!mapImage || mapImage.dataset.loadStarted === "true") return;
    const source = mapImage.dataset.src;
    if (!source) {
      handleMapError();
      return;
    }
    mapImage.dataset.loadStarted = "true";
    mapImage.setAttribute("aria-busy", "true");
    mapStatus.textContent = "El mapa empieza a aparecer entre las p\xE1ginas.";
    mapImage.src = source;
    if (mapImage.complete) {
      if (mapImage.naturalWidth > 0) handleMapLoad();
      else handleMapError();
    }
  }
  function handleMapLoad() {
    if (!mapImage || !mapStatus) return;
    mapImage.hidden = false;
    mapImage.classList.remove("asset-missing");
    mapImage.removeAttribute("aria-busy");
    mapImage.dataset.resourceReady = "true";
    mapStatus.textContent = "El mapa queda abierto. La cruz todav\xEDa espera.";
  }
  function handleMapError() {
    if (!mapImage || !mapStatus) return;
    mapImage.hidden = true;
    mapImage.classList.add("asset-missing");
    mapImage.removeAttribute("aria-busy");
    mapImage.dataset.resourceReady = "false";
    mapStatus.textContent = "El mapa no aparece, pero los nombres y la cruz siguen en la libreta.";
  }
  function reviewUnnamedPoint() {
    if (pointReviewed) return;
    pointReviewed = true;
    syncReviewState();
    onCompleteCallback4 == null ? void 0 : onCompleteCallback4();
    revelationEl == null ? void 0 : revelationEl.focus();
  }
  function syncReviewState() {
    if (!reviewBtn2 || !revelationEl) return;
    revelationEl.hidden = !pointReviewed;
    reviewBtn2.setAttribute("aria-expanded", String(pointReviewed));
    reviewBtn2.disabled = pointReviewed;
    reviewBtn2.textContent = pointReviewed ? "Punto sin nombre examinado" : "Examinar la cruz sin nombre";
  }
  function getMapSpreadIndex() {
    const index = spreads.findIndex((spread) => spread.dataset.spread === "key");
    return index >= 0 ? index : spreads.length - 1;
  }
  function getReviewSpreadIndex() {
    const index = spreads.findIndex((spread) => spread.dataset.spread === "review");
    return index >= 0 ? index : spreads.length - 1;
  }
  function canAnimate() {
    return !state.get("reducedMotion") && typeof window.gsap !== "undefined";
  }
  function resetAnimatedStyles(element) {
    if (!element) return;
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
  }

  // js/branches/map-col.js
  var pointsContainer2;
  var statusEl2;
  var inspectBtn;
  var followBtn;
  var completeBtn;
  var recognitionPhase;
  var visitPhase;
  var completionEl;
  var onCompleteCallback5 = null;
  var listenersBound3 = false;
  var currentStep = 0;
  var completed = false;
  function initMapCol(asideEl, { onComplete } = {}) {
    var _a2;
    onCompleteCallback5 = onComplete;
    pointsContainer2 = asideEl.querySelector("#map-col-points");
    statusEl2 = asideEl.querySelector("#map-col-status");
    inspectBtn = asideEl.querySelector("#map-col-inspect");
    followBtn = asideEl.querySelector("#map-col-follow");
    completeBtn = asideEl.querySelector("#map-col-complete");
    recognitionPhase = asideEl.querySelector("#map-col-phase-recognition");
    visitPhase = asideEl.querySelector("#map-col-phase-visit");
    completionEl = asideEl.querySelector("#map-col-completion");
    completed = Boolean(
      completed || ((_a2 = state.get("completedBranches")) == null ? void 0 : _a2.has("map-col"))
    );
    if (completed) currentStep = 3;
    buildPoints();
    if (!listenersBound3) {
      inspectBtn == null ? void 0 : inspectBtn.addEventListener("click", inspectUnnamedPoint);
      followBtn == null ? void 0 : followBtn.addEventListener("click", followApproximateLocation);
      completeBtn == null ? void 0 : completeBtn.addEventListener("click", completeVisit);
      listenersBound3 = true;
    }
    syncView2();
  }
  function destroyMapCol() {
    if (typeof window.gsap !== "undefined") {
      window.gsap.killTweensOf([recognitionPhase, visitPhase, completionEl]);
    }
    [recognitionPhase, visitPhase, completionEl].forEach(resetAnimatedStyles2);
  }
  function buildPoints() {
    if (!pointsContainer2) return;
    pointsContainer2.innerHTML = "";
    MAP_POINTS.forEach((point) => {
      const item = document.createElement("div");
      const isUnnamed = Boolean(point.isEndPoint);
      item.className = `map-col-point is-placed${isUnnamed ? " map-col-point--unnamed" : ""}`;
      item.dataset.pointId = point.id;
      item.style.left = `${point.svgCoords.x * 100}%`;
      item.style.top = `${point.svgCoords.y * 100}%`;
      item.setAttribute("role", "listitem");
      item.setAttribute(
        "aria-label",
        isUnnamed ? "Cruz sin nombre" : `${point.person} \xB7 recuerdo relacionado`
      );
      const mark = document.createElement("span");
      mark.className = "map-col-point__mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "\xD7";
      item.appendChild(mark);
      if (!isUnnamed) {
        const label = document.createElement("span");
        label.className = "map-col-point__label";
        label.textContent = point.person;
        item.appendChild(label);
      }
      pointsContainer2.appendChild(item);
    });
  }
  function inspectUnnamedPoint() {
    if (currentStep >= 1) return;
    currentStep = 1;
    syncView2();
    revealPhase(recognitionPhase);
    recognitionPhase == null ? void 0 : recognitionPhase.focus();
  }
  function followApproximateLocation() {
    if (currentStep >= 2) return;
    currentStep = 2;
    syncView2();
    revealPhase(visitPhase);
    visitPhase == null ? void 0 : visitPhase.focus();
  }
  function completeVisit() {
    if (completed) return;
    completed = true;
    currentStep = 3;
    syncView2();
    onCompleteCallback5 == null ? void 0 : onCompleteCallback5();
    revealPhase(completionEl);
    completionEl == null ? void 0 : completionEl.focus();
  }
  function syncView2() {
    const point = pointsContainer2 == null ? void 0 : pointsContainer2.querySelector(".map-col-point--unnamed");
    point == null ? void 0 : point.classList.toggle("is-emphasized", currentStep >= 1);
    recognitionPhase.hidden = currentStep < 1;
    visitPhase.hidden = currentStep < 2;
    completionEl.hidden = !completed;
    inspectBtn.disabled = currentStep >= 1;
    inspectBtn.setAttribute("aria-expanded", String(currentStep >= 1));
    inspectBtn.textContent = currentStep >= 1 ? "Cruz sin nombre ampliada" : "Ampliar la cruz sin nombre";
    followBtn.disabled = currentStep >= 2;
    followBtn.setAttribute("aria-expanded", String(currentStep >= 2));
    followBtn.textContent = currentStep >= 2 ? "Ubicaci\xF3n aproximada recorrida" : "Seguir la ubicaci\xF3n aproximada";
    completeBtn.disabled = completed;
    completeBtn.setAttribute("aria-expanded", String(completed));
    completeBtn.textContent = completed ? "Visita registrada" : "Registrar la visita y volver al laboratorio";
    if (statusEl2) {
      statusEl2.textContent = completed ? "Visita registrada \xB7 regreso al laboratorio" : currentStep >= 2 ? "Visita de campo" : currentStep >= 1 ? "Zona reconocida" : "Una marca todav\xEDa sola";
    }
  }
  function revealPhase(element) {
    if (!element || state.get("reducedMotion") || typeof window.gsap === "undefined") return;
    window.gsap.fromTo(
      element,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }
  function resetAnimatedStyles2(element) {
    if (!element) return;
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
  }

  // js/branches/archivo.js
  var COMBINATION = Object.freeze([1, 9, 6, 2, 4, 7]);
  var dials = [];
  var dialValues = [0, 0, 0, 0, 0, 0];
  var hatchEl;
  var mechanismBodyEl;
  var mechanismEl;
  var statusEl3;
  var phase1El;
  var phase2El;
  var contentsEl;
  var onCompleteCallback6 = null;
  var sequenceState = "idle";
  var activeTimeline = null;
  function initArchivo(asideEl, { onComplete } = {}) {
    onCompleteCallback6 = onComplete;
    dials = Array.from(asideEl.querySelectorAll(".camera-dial"));
    hatchEl = asideEl.querySelector("#camera-hatch");
    mechanismBodyEl = asideEl.querySelector(".camera-mechanism__body");
    mechanismEl = asideEl.querySelector(".dial-mechanism");
    statusEl3 = asideEl.querySelector("#dial-status");
    phase1El = asideEl.querySelector("#archivo-phase-1");
    phase2El = asideEl.querySelector("#archivo-phase-2");
    contentsEl = phase2El.querySelector(".compartimento-open");
    bindInteractions3();
    if (state.get("compartmentOpened")) {
      showOpenedState();
      return;
    }
    showDialState();
    if (state.get("combinationEntered")) {
      dialValues = [...COMBINATION];
      syncAllDials();
      startOpeningSequence();
    } else {
      syncAllDials();
    }
  }
  function destroyArchivo() {
    activeTimeline == null ? void 0 : activeTimeline.kill();
    activeTimeline = null;
    if (typeof window.gsap !== "undefined") {
      dials.forEach((dial) => gsap.killTweensOf(dial));
      gsap.killTweensOf([phase1El, phase2El, hatchEl, mechanismBodyEl, contentsEl]);
    }
    mechanismBodyEl == null ? void 0 : mechanismBodyEl.classList.remove("has-clicked");
    mechanismBodyEl == null ? void 0 : mechanismBodyEl.style.removeProperty("--flash-opacity");
    mechanismEl == null ? void 0 : mechanismEl.removeAttribute("aria-busy");
    if (sequenceState === "opening" && !state.get("compartmentOpened")) {
      sequenceState = "idle";
    }
  }
  function bindInteractions3() {
    dials.forEach((dial, index) => {
      if (dial.dataset.archivoBound === "true") return;
      dial.dataset.archivoBound = "true";
      let dragStartY = 0;
      let dragStartValue = 0;
      let isDragging = false;
      dial.addEventListener("pointerdown", (event) => {
        var _a2;
        if (sequenceState !== "idle") return;
        isDragging = true;
        dragStartY = event.clientY;
        dragStartValue = dialValues[index];
        (_a2 = dial.setPointerCapture) == null ? void 0 : _a2.call(dial, event.pointerId);
      });
      dial.addEventListener("pointermove", (event) => {
        if (!isDragging || sequenceState !== "idle") return;
        const steps = Math.round((dragStartY - event.clientY) / 20);
        setDialValue(index, dragStartValue + steps);
      });
      const finishDrag = (event) => {
        var _a2;
        isDragging = false;
        if ((event == null ? void 0 : event.pointerId) != null && ((_a2 = dial.hasPointerCapture) == null ? void 0 : _a2.call(dial, event.pointerId))) {
          dial.releasePointerCapture(event.pointerId);
        }
      };
      dial.addEventListener("pointerup", finishDrag);
      dial.addEventListener("pointercancel", finishDrag);
      dial.addEventListener("wheel", (event) => {
        if (sequenceState !== "idle") return;
        event.preventDefault();
        setDialValue(index, dialValues[index] + (event.deltaY > 0 ? -1 : 1));
      }, { passive: false });
      dial.addEventListener("keydown", (event) => {
        if (sequenceState !== "idle") return;
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setDialValue(index, dialValues[index] + 1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          setDialValue(index, dialValues[index] - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          setDialValue(index, 0);
        }
      });
    });
  }
  function setDialValue(index, rawValue, { verify = true } = {}) {
    if (sequenceState !== "idle") return;
    dialValues[index] = (rawValue % 10 + 10) % 10;
    syncDial(index);
    if (statusEl3) {
      statusEl3.textContent = `Dial ${index + 1}: ${dialValues[index]}. Contin\xFAa con la combinaci\xF3n reconstruida.`;
    }
    if (verify) checkCombination();
  }
  function syncDial(index) {
    const dial = dials[index];
    if (!dial) return;
    const value = dialValues[index];
    dial.textContent = String(value);
    dial.setAttribute("aria-valuenow", String(value));
    dial.setAttribute(
      "aria-valuetext",
      `${value}. El valor reconstruido para esta posici\xF3n es ${COMBINATION[index]}.`
    );
    dial.classList.toggle("is-correct", value === COMBINATION[index]);
  }
  function syncAllDials() {
    dials.forEach((_, index) => syncDial(index));
  }
  function checkCombination() {
    const isComplete = dialValues.every((value, index) => value === COMBINATION[index]);
    if (!isComplete || sequenceState !== "idle") return;
    state.set("combinationEntered", true);
    startOpeningSequence();
  }
  function startOpeningSequence() {
    if (sequenceState !== "idle" || state.get("compartmentOpened")) return;
    sequenceState = "opening";
    setInteractionEnabled(false);
    mechanismEl == null ? void 0 : mechanismEl.setAttribute("aria-busy", "true");
    if (statusEl3) {
      statusEl3.textContent = "Combinaci\xF3n correcta. El mecanismo se libera.";
      statusEl3.classList.add("is-correct");
    }
    const reduced = state.get("reducedMotion");
    if (reduced || typeof window.gsap === "undefined") {
      hatchEl.setAttribute("data-state", "open");
      transitionToContents();
      return;
    }
    mechanismBodyEl.classList.add("has-clicked");
    activeTimeline = gsap.timeline({
      onComplete: () => {
        activeTimeline = null;
      }
    });
    activeTimeline.to(mechanismBodyEl, {
      duration: 0.25,
      ease: "power1.inOut",
      onUpdate() {
        const progress = this.progress();
        const opacity = progress < 0.35 ? progress / 0.35 : 1 - (progress - 0.35) / 0.65;
        mechanismBodyEl.style.setProperty(
          "--flash-opacity",
          String(Math.max(0, opacity))
        );
      },
      onComplete: () => {
        mechanismBodyEl.classList.remove("has-clicked");
        mechanismBodyEl.style.removeProperty("--flash-opacity");
      }
    });
    activeTimeline.to(hatchEl, {
      duration: 0.65,
      ease: "power2.inOut",
      onStart: () => hatchEl.setAttribute("data-state", "open")
    });
    activeTimeline.add(transitionToContents, "+=0.15");
  }
  function transitionToContents() {
    const reduced = state.get("reducedMotion");
    if (reduced || typeof window.gsap === "undefined") {
      phase1El.hidden = true;
      phase2El.hidden = false;
      phase2El.style.opacity = "1";
      revealContents();
      return;
    }
    gsap.to(phase1El, {
      opacity: 0,
      y: -8,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        phase1El.hidden = true;
        phase2El.hidden = false;
        gsap.fromTo(
          phase2El,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: "power2.out",
            onComplete: revealContents
          }
        );
      }
    });
  }
  function revealContents() {
    const evidenceAlreadyCompleted = state.get("compartmentOpened");
    contentsEl == null ? void 0 : contentsEl.classList.add("is-revealed");
    phase2El == null ? void 0 : phase2El.focus({ preventScroll: false });
    mechanismEl == null ? void 0 : mechanismEl.removeAttribute("aria-busy");
    sequenceState = "open";
    state.set("compartmentOpened", true);
    if (!evidenceAlreadyCompleted) onCompleteCallback6 == null ? void 0 : onCompleteCallback6();
  }
  function showDialState() {
    sequenceState = "idle";
    phase1El.hidden = false;
    phase1El.style.removeProperty("opacity");
    phase1El.style.removeProperty("transform");
    phase2El.hidden = true;
    phase2El.style.removeProperty("opacity");
    phase2El.style.removeProperty("transform");
    contentsEl == null ? void 0 : contentsEl.classList.remove("is-revealed");
    hatchEl.setAttribute("data-state", "closed");
    mechanismEl == null ? void 0 : mechanismEl.removeAttribute("aria-busy");
    statusEl3 == null ? void 0 : statusEl3.classList.remove("is-correct");
    if (statusEl3) statusEl3.textContent = "Gira los diales para ingresar la combinaci\xF3n.";
    setInteractionEnabled(true);
  }
  function showOpenedState() {
    dialValues = [...COMBINATION];
    syncAllDials();
    sequenceState = "open";
    phase1El.hidden = true;
    phase2El.hidden = false;
    phase2El.style.opacity = "1";
    phase2El.style.removeProperty("transform");
    contentsEl == null ? void 0 : contentsEl.classList.add("is-revealed");
    hatchEl.setAttribute("data-state", "open");
    mechanismEl == null ? void 0 : mechanismEl.removeAttribute("aria-busy");
    setInteractionEnabled(false);
  }
  function setInteractionEnabled(enabled) {
    dials.forEach((dial) => {
      dial.setAttribute("aria-disabled", String(!enabled));
      dial.tabIndex = enabled ? 0 : -1;
    });
  }

  // js/branches/fishbone.js?v=ernesto-sync-2
  var BRANCH_MODULES = {
    podcast: { init: initPodcast, destroy: destroyPodcast },
    mapa: { init: initMapa, destroy: destroyMapa },
    video: { init: initVideo, destroy: destroyVideo },
    libreta: { init: initLibreta, destroy: destroyLibreta },
    "map-col": { init: initMapCol, destroy: destroyMapCol },
    archivo: { init: initArchivo, destroy: destroyArchivo }
  };
  var LOCK_CONDITIONS = {
    podcast: () => true,
    mapa: () => true,
    video: () => true,
    libreta: () => true,
    "map-col": () => state.get("lastPointUnlocked"),
    archivo: () => state.get("archiveUnlocked")
  };
  var LOCK_MESSAGES = {
    "map-col": "Primero completa la libreta de Gabriel.",
    archivo: "Re\xFAne la voz de Ernesto, el mapa de Luc\xEDa y la confirmaci\xF3n de los Quispe."
  };
  var NAV_STATE = {
    phase: "SPINE_FLOWING",
    activeBranch: null,
    returnScrollY: 0,
    opener: null
  };
  var removeArchiveListener = null;
  var removeLastPointListener = null;
  function initFishbone() {
    bindCloseButtons();
    bindKeyboardNavigation();
    syncLockState("archivo");
    syncLockState("map-col");
    removeArchiveListener = state.on("archiveUnlocked", () => syncLockState("archivo"));
    removeLastPointListener = state.on("lastPointUnlocked", () => syncLockState("map-col"));
    return { activate: activateBranch };
  }
  function activateBranch(branchId) {
    var _a2;
    if (NAV_STATE.phase !== "SPINE_FLOWING") return;
    const asideEl = document.querySelector(`#branch-${branchId}`);
    const button = document.querySelector(`.branch-node__enter[data-branch="${branchId}"]`);
    if (!asideEl || !button) return;
    if (!((_a2 = LOCK_CONDITIONS[branchId]) == null ? void 0 : _a2.call(LOCK_CONDITIONS))) {
      announceLockedBranch(branchId, button);
      return;
    }
    NAV_STATE.phase = "BRANCH_ENTERING";
    NAV_STATE.activeBranch = branchId;
    NAV_STATE.returnScrollY = getScrollY();
    NAV_STATE.opener = button;
    state.set("activeBranch", branchId);
    state.markVisited(branchId);
    pause();
    button.setAttribute("aria-expanded", "true");
    asideEl.hidden = false;
    asideEl.setAttribute("aria-hidden", "false");
    asideEl.setAttribute("role", "dialog");
    asideEl.setAttribute("aria-modal", "true");
    asideEl.setAttribute("data-lenis-prevent", "");
    asideEl.classList.add("is-open");
    asideEl.scrollTop = 0;
    const finishOpening = () => {
      var _a3, _b2;
      NAV_STATE.phase = "BRANCH_ACTIVE";
      (_a3 = BRANCH_MODULES[branchId]) == null ? void 0 : _a3.init(asideEl, {
        onComplete: () => state.markCompleted(branchId)
      });
      (_b2 = asideEl.querySelector(".branch__close")) == null ? void 0 : _b2.focus();
    };
    if (canAnimate2()) {
      gsap.fromTo(
        asideEl,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          onComplete: finishOpening
        }
      );
    } else {
      asideEl.style.opacity = "1";
      finishOpening();
    }
  }
  function closeBranch(branchId) {
    var _a2;
    if (!["BRANCH_ACTIVE", "BRANCH_ENTERING"].includes(NAV_STATE.phase)) return;
    if (branchId !== NAV_STATE.activeBranch) return;
    const asideEl = document.querySelector(`#branch-${branchId}`);
    if (!asideEl) return;
    NAV_STATE.phase = "BRANCH_EXITING";
    (_a2 = BRANCH_MODULES[branchId]) == null ? void 0 : _a2.destroy(asideEl);
    if (typeof window.gsap !== "undefined") gsap.killTweensOf(asideEl);
    const finishClosing = () => {
      var _a3;
      asideEl.classList.remove("is-open");
      asideEl.hidden = true;
      asideEl.setAttribute("aria-hidden", "true");
      asideEl.removeAttribute("aria-modal");
      asideEl.setAttribute("role", "complementary");
      asideEl.style.removeProperty("opacity");
      (_a3 = NAV_STATE.opener) == null ? void 0 : _a3.setAttribute("aria-expanded", "false");
      resume();
      scrollTo(NAV_STATE.returnScrollY, { immediate: true });
      state.set("activeBranch", null);
      const opener = NAV_STATE.opener;
      NAV_STATE.phase = "SPINE_FLOWING";
      NAV_STATE.activeBranch = null;
      NAV_STATE.opener = null;
      refreshScrollTriggers();
      opener == null ? void 0 : opener.focus({ preventScroll: true });
    };
    if (canAnimate2()) {
      gsap.to(asideEl, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: finishClosing
      });
    } else {
      finishClosing();
    }
  }
  function bindCloseButtons() {
    document.querySelectorAll(".branch__close").forEach((button) => {
      button.addEventListener("click", () => closeBranch(button.dataset.branch));
    });
  }
  function bindKeyboardNavigation() {
    document.addEventListener("keydown", (event) => {
      if (!NAV_STATE.activeBranch) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeBranch(NAV_STATE.activeBranch);
        return;
      }
      if (event.key !== "Tab" || NAV_STATE.phase !== "BRANCH_ACTIVE") return;
      const asideEl = document.querySelector(`#branch-${NAV_STATE.activeBranch}`);
      const focusable = getFocusableElements(asideEl);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
  function getFocusableElements(container) {
    if (!container) return [];
    return [...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.hidden && element.getClientRects().length > 0);
  }
  function syncLockState(branchId) {
    var _a2;
    const unlocked = Boolean((_a2 = LOCK_CONDITIONS[branchId]) == null ? void 0 : _a2.call(LOCK_CONDITIONS));
    const button = document.querySelector(`.branch-node__enter[data-branch="${branchId}"]`);
    const node = button == null ? void 0 : button.closest(".branch-node");
    if (!button) return;
    button.disabled = false;
    button.setAttribute("aria-disabled", String(!unlocked));
    button.dataset.locked = String(!unlocked);
    node == null ? void 0 : node.setAttribute("data-locked", String(!unlocked));
  }
  function announceLockedBranch(branchId, button) {
    const node = button.closest(".branch-node");
    const liveRegion = node == null ? void 0 : node.querySelector("[aria-live]");
    const message = LOCK_MESSAGES[branchId] || "Este contenido todav\xEDa no est\xE1 disponible.";
    if (liveRegion) {
      const target = liveRegion.querySelector("p") || liveRegion;
      target.textContent = message;
    } else {
      button.setAttribute("aria-label", message);
    }
    if (!state.get("reducedMotion") && typeof window.gsap !== "undefined") {
      gsap.fromTo(node, { x: 0 }, {
        x: 5,
        duration: 0.06,
        repeat: 3,
        yoyo: true,
        onComplete: () => gsap.set(node, { x: 0 })
      });
    }
  }
  function canAnimate2() {
    return !state.get("reducedMotion") && typeof window.gsap !== "undefined";
  }

  // js/spine/climax.js
  function initClimaxFlow() {
    bindSecondRollReview();
    bindClimaxFallback();
  }
  function bindSecondRollReview() {
    const button = document.querySelector("#second-roll-review");
    const status = document.querySelector("#second-roll-review-status");
    const target = document.querySelector("#beat-nina");
    if (!button || !target) return;
    const sync = () => {
      const unlocked = state.get("climaxUnlocked");
      button.setAttribute("aria-expanded", String(unlocked));
      button.setAttribute("aria-disabled", String(unlocked));
      button.textContent = unlocked ? "\xDAltimo fotograma abierto" : "Observar el \xFAltimo fotograma";
      if (unlocked) button.disabled = true;
    };
    button.addEventListener("click", () => {
      if (state.get("climaxUnlocked")) return;
      state.set("secondRollReviewed", true);
      if (status) {
        status.textContent = "El \xFAltimo fotograma queda listo para mirarse.";
      }
      const image = target.querySelector(".reveal-target--climax");
      if (image) observe(image);
      requestAnimationFrame(() => {
        var _a2;
        scrollTo(target, { offset: -24 });
        (_a2 = target.focus) == null ? void 0 : _a2.call(target, { preventScroll: true });
      });
    });
    state.on("climaxUnlocked", sync);
    sync();
  }
  function bindClimaxFallback() {
    const image = document.querySelector("#photo-nina img");
    const fallback = document.querySelector("#nina-valeria-fallback");
    if (!image || !fallback) return;
    image.addEventListener("error", () => {
      fallback.hidden = false;
    });
  }

  // js/main.js
  function bootstrap() {
    if (typeof gsap === "undefined") {
      console.info("[LMDC] Animaci\xF3n avanzada no disponible; la experiencia contin\xFAa en modo nativo.");
    }
    registerEasings();
    initScroll();
    initReveal();
    const fishbone = initFishbone();
    initSpine({
      onActivateBranch: (branchId) => fishbone.activate(branchId)
    });
    initClimaxFlow();
    logArchitectureReady();
  }
  function logArchitectureReady() {
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      console.log(
        "%cLa Memoria de una Ciudad%c \u2014 arquitectura fishbone inicializada.",
        "color:#B07D3A;font-weight:bold;",
        "color:#7A5C3A;"
      );
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
  window.addEventListener("load", () => {
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });
})();
