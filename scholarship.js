(function () {
  "use strict";

  // --- Configuration -------------------------------------------------------
  // Application closes at the end of the deadline day, local time.
  const DEADLINE = new Date(2026, 5, 19, 23, 59, 59); // June 19, 2026 (month is 0-indexed)
  const CONTACT_EMAIL = "Say-Scholarships@saybrook.edu";
  // TODO: replace "#" with the real Scholarship Application Submission Form URL.
  const SUBMISSION_FORM_URL = "#";

  // --- Requirements --------------------------------------------------------
  // Each requirement maps a form field (by name) to an evaluation of the
  // chosen answer. `severity` distinguishes a hard "disqualify" (the answer
  // makes the application invalid as submitted) from a "blocker" (a condition
  // the applicant still needs to satisfy before they can qualify). Keeping the
  // rules here as plain data makes the logic transparent and easy to tune.
  const REQUIREMENTS = [
    {
      key: "count",
      label: "One scholarship per year",
      evaluate: (v) =>
        v === "multiple"
          ? {
              ok: false,
              severity: "disqualify",
              note: "You may apply for only one scholarship per year — choose a single one of the nine.",
            }
          : { ok: true, note: "Applying to a single scholarship this year." },
    },
    {
      key: "wonBefore",
      label: "Not a previous winner of this scholarship",
      evaluate: (v) =>
        v === "yes"
          ? {
              ok: false,
              severity: "disqualify",
              note: "Each scholarship can be won only once in a lifetime. Consider applying for a different one.",
            }
          : { ok: true, note: "You have not previously won this scholarship." },
    },
    {
      key: "register",
      label: "Registered before Fall 2026",
      evaluate: (v) =>
        v === "no"
          ? {
              ok: false,
              severity: "blocker",
              note: "You must be registered before the Fall 2026 semester starts to qualify.",
            }
          : { ok: true, note: "You will be registered before Fall 2026." },
    },
    {
      key: "enroll",
      label: "Enrolled in Fall 2026 courses",
      evaluate: (v) =>
        v === "no"
          ? {
              ok: false,
              severity: "blocker",
              note: "The award is applied to your Fall 2026 student account, so you must be enrolled that semester.",
            }
          : { ok: true, note: "You will be enrolled in Fall 2026 courses." },
    },
    {
      key: "form",
      label: "Submitted via the official form by the deadline",
      evaluate: (v) =>
        v === "no"
          ? {
              ok: false,
              severity: "blocker",
              note: "Applications are accepted only through the official submission form, by June 19, 2026.",
            }
          : { ok: true, note: "You will submit through the official form by the deadline." },
    },
    {
      key: "anonymous",
      label: "No identifying information in the upload",
      evaluate: (v) =>
        v === "no"
          ? {
              ok: false,
              severity: "disqualify",
              note: "Identifying information in the uploaded application leads to disqualification. Remove all identifying details from the document — contact info goes on the form only.",
            }
          : { ok: true, note: "Your uploaded application will contain no identifying information." },
    },
    {
      key: "publicity",
      label: "Agree to public recognition if selected",
      evaluate: (v) =>
        v === "no"
          ? {
              ok: false,
              severity: "blocker",
              note: "Recipients must agree to have their name, information, and images shared publicly.",
            }
          : { ok: true, note: "You agree to public recognition if selected." },
    },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const form = $("#eligibility-form");
  const resultsEl = $("#results");
  const verdictEl = $("#verdict");
  const verdictIcon = $("#verdict-icon");
  const verdictTitle = $("#verdict-title");
  const verdictSub = $("#verdict-sub");
  const requirementList = $("#requirement-list");
  const nextStepsEl = $("#next-steps");
  const recheckBtn = $("#recheck");
  const countdownEl = $("#countdown");

  // --- Deadline countdown --------------------------------------------------
  function deadlinePassed() {
    return Date.now() > DEADLINE.getTime();
  }

  function updateCountdown() {
    const msLeft = DEADLINE.getTime() - Date.now();
    if (msLeft <= 0) {
      countdownEl.textContent = "The deadline has passed.";
      return;
    }
    const days = Math.floor(msLeft / 86400000);
    if (days >= 1) {
      countdownEl.textContent = days + (days === 1 ? " day left" : " days left");
    } else {
      const hours = Math.max(1, Math.ceil(msLeft / 3600000));
      countdownEl.textContent = hours + (hours === 1 ? " hour left" : " hours left");
    }
  }

  // --- Form handling -------------------------------------------------------
  function readForm() {
    const data = new FormData(form);
    const input = {};
    REQUIREMENTS.forEach((r) => {
      input[r.key] = data.get(r.key);
    });
    return input;
  }

  function validate(input) {
    const errors = {};
    REQUIREMENTS.forEach((r) => {
      if (!input[r.key]) errors[r.key] = "Please answer this question";
    });
    return errors;
  }

  function showErrors(errors) {
    $$(".error").forEach((el) => (el.textContent = ""));
    $$("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    Object.entries(errors).forEach(([key, msg]) => {
      const errEl = $(`[data-error-for="${key}"]`);
      if (errEl) errEl.textContent = msg;
      const field = form.elements[key];
      if (field) field.setAttribute("aria-invalid", "true");
    });
  }

  function evaluateAll(input) {
    const checks = REQUIREMENTS.map((r) => {
      const result = r.evaluate(input[r.key]);
      return { label: r.label, ...result };
    });

    if (deadlinePassed()) {
      checks.push({
        label: "Application window open",
        ok: false,
        severity: "disqualify",
        note: "The application deadline (June 19, 2026) has passed.",
      });
    } else {
      checks.push({
        label: "Application window open",
        ok: true,
        note: "The application window is open until June 19, 2026.",
      });
    }

    const blockers = checks.filter((c) => !c.ok);
    const hasDisqualifier = blockers.some((c) => c.severity === "disqualify");
    const eligible = blockers.length === 0;

    // Unmet requirements first so problems surface at the top.
    checks.sort((a, b) => Number(a.ok) - Number(b.ok));

    return { checks, blockers, hasDisqualifier, eligible };
  }

  // --- Rendering -----------------------------------------------------------
  function renderVerdict(result) {
    verdictEl.classList.remove("eligible", "ineligible");
    if (result.eligible) {
      verdictEl.classList.add("eligible");
      verdictIcon.textContent = "✓";
      verdictTitle.textContent = "You appear eligible to apply";
      verdictSub.textContent =
        "Based on your answers, you meet the eligibility requirements. Complete and submit your application before the deadline.";
    } else {
      verdictEl.classList.add("ineligible");
      verdictIcon.textContent = "✕";
      verdictTitle.textContent = result.hasDisqualifier
        ? "Some answers would disqualify your application"
        : "Not eligible yet";
      const n = result.blockers.length;
      verdictSub.textContent =
        "Resolve the " + n + (n === 1 ? " item" : " items") + " marked below before you apply.";
    }
  }

  function renderChecklist(checks) {
    requirementList.innerHTML = "";
    checks.forEach((c) => {
      const li = document.createElement("li");
      li.className = "factor " + (c.ok ? "positive" : "negative");

      const main = document.createElement("div");
      const name = document.createElement("span");
      name.className = "factor-name";
      name.textContent = c.label;
      const note = document.createElement("span");
      note.className = "factor-note";
      note.textContent = c.note || "";
      main.append(name, note);

      const badge = document.createElement("span");
      badge.className = "factor-delta";
      badge.textContent = c.ok ? "✓" : "✕";
      badge.setAttribute("aria-label", c.ok ? "Met" : "Not met");

      li.append(main, badge);
      requirementList.appendChild(li);
    });
  }

  function renderNextSteps(result) {
    nextStepsEl.innerHTML = "";
    const h = document.createElement("h2");
    h.textContent = "Next steps";
    nextStepsEl.appendChild(h);

    const list = document.createElement("ul");
    list.className = "steps";
    const steps = [];

    if (result.eligible) {
      steps.push("Prepare your application document with <strong>no identifying information</strong> in it.");
      steps.push("Enter your contact details on the submission form (not in the uploaded document).");
      steps.push("Submit through the official form before <strong>June 19, 2026</strong>.");
      steps.push("Optional: ask the Saybrook University Writing Center to review your written submission.");
    } else {
      result.blockers.forEach((b) => steps.push(b.note));
      steps.push("Re-check once you have addressed the items above.");
    }

    steps.forEach((text) => {
      const li = document.createElement("li");
      li.innerHTML = text;
      list.appendChild(li);
    });
    nextStepsEl.appendChild(list);

    const cta = document.createElement("div");
    cta.className = "actions";

    const apply = document.createElement("a");
    apply.className = "btn btn-primary";
    apply.href = SUBMISSION_FORM_URL;
    apply.textContent = "Open the submission form";
    if (SUBMISSION_FORM_URL === "#") {
      apply.setAttribute("aria-disabled", "true");
      apply.title = "Submission form link not configured yet";
    } else {
      apply.target = "_blank";
      apply.rel = "noopener";
    }

    const email = document.createElement("a");
    email.className = "btn btn-ghost";
    email.href = "mailto:" + CONTACT_EMAIL;
    email.textContent = "Email a question";

    cta.append(apply, email);
    nextStepsEl.appendChild(cta);
  }

  function renderResults(result) {
    renderVerdict(result);
    renderChecklist(result.checks);
    renderNextSteps(result);
    resultsEl.classList.remove("hidden");
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    resultsEl.focus({ preventScroll: true });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = readForm();
    const errors = validate(input);
    showErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = form.elements[firstKey];
      if (el && typeof el.focus === "function") el.focus();
      return;
    }
    renderResults(evaluateAll(input));
  });

  form.addEventListener("reset", () => {
    showErrors({});
    resultsEl.classList.add("hidden");
  });

  recheckBtn.addEventListener("click", () => {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstField = form.querySelector("select");
    if (firstField) firstField.focus();
  });

  updateCountdown();
})();
