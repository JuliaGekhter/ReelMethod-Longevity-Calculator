(function () {
  "use strict";

  const BASELINE = { female: 81.1, male: 75.8 };
  const CLAMP_MIN = 50;
  const CLAMP_MAX = 110;

  const FACTOR_DEFS = [
    {
      key: "smoking",
      label: "Smoking",
      score: (v) => ({ never: 0, former: -2, light: -5, heavy: -9 }[v] ?? 0),
      note: (v) =>
        ({
          never: "No tobacco exposure",
          former: "Past use still carries some risk",
          light: "Active smoking shortens lifespan",
          heavy: "Heavy smoking is the single biggest modifiable risk",
        }[v]),
    },
    {
      key: "alcohol",
      label: "Alcohol",
      score: (v) => ({ none: 0, light: 0, moderate: -1, heavy: -4 }[v] ?? 0),
      note: (v) =>
        ({
          none: "Low or no alcohol use",
          light: "Light intake has minimal impact",
          moderate: "Daily drinking adds modest risk",
          heavy: "Heavy intake significantly raises risk",
        }[v]),
    },
    {
      key: "exercise",
      label: "Exercise",
      score: (v) => ({ sedentary: -3, light: 0, moderate: 2, vigorous: 4 }[v] ?? 0),
      note: (v) =>
        ({
          sedentary: "Sedentary lifestyle is a major risk",
          light: "Some movement helps",
          moderate: "Regular activity adds healthy years",
          vigorous: "Consistent vigorous exercise is strongly protective",
        }[v]),
    },
    {
      key: "diet",
      label: "Diet quality",
      score: (v) => ({ poor: -2, average: 0, good: 3 }[v] ?? 0),
      note: (v) =>
        ({
          poor: "Highly processed diet raises chronic disease risk",
          average: "Mixed diet is neutral",
          good: "Whole-food, plant-forward eating is protective",
        }[v]),
    },
    {
      key: "sleep",
      label: "Sleep",
      score: (v) => ({ short: -2, ideal: 1, long: -1 }[v] ?? 0),
      note: (v) =>
        ({
          short: "Chronic short sleep raises mortality risk",
          ideal: "7-9 hours is the sweet spot",
          long: "Very long sleep can correlate with health issues",
        }[v]),
    },
    {
      key: "bmi",
      label: "Body mass index",
      score: (bmi) => {
        if (!bmi || !isFinite(bmi)) return 0;
        if (bmi < 18.5) return -2;
        if (bmi < 25) return 0;
        if (bmi < 30) return -1;
        if (bmi < 35) return -3;
        return -5;
      },
      note: (bmi) => {
        if (!bmi || !isFinite(bmi)) return "";
        if (bmi < 18.5) return "Underweight (BMI < 18.5)";
        if (bmi < 25) return "Healthy range (BMI 18.5-25)";
        if (bmi < 30) return "Overweight (BMI 25-30)";
        if (bmi < 35) return "Obese class I (BMI 30-35)";
        return "Obese class II+ (BMI 35+)";
      },
    },
    {
      key: "stress",
      label: "Stress",
      score: (v) => ({ low: 1, moderate: 0, high: -3 }[v] ?? 0),
      note: (v) =>
        ({
          low: "Low stress supports longevity",
          moderate: "Manageable stress is neutral",
          high: "Chronic stress drives cardiovascular and metabolic risk",
        }[v]),
    },
    {
      key: "social",
      label: "Social connection",
      score: (v) => ({ strong: 2, moderate: 0, isolated: -3 }[v] ?? 0),
      note: (v) =>
        ({
          strong: "Close relationships extend life",
          moderate: "Some connection is protective",
          isolated: "Loneliness has a mortality impact comparable to smoking",
        }[v]),
    },
    {
      key: "purpose",
      label: "Sense of purpose",
      score: (v) => ({ high: 1, low: -1 }[v] ?? 0),
      note: (v) =>
        ({
          high: "Purposeful engagement is associated with longer life",
          low: "Lack of purpose correlates with worse health outcomes",
        }[v]),
    },
    {
      key: "preventive",
      label: "Preventive care",
      score: (v) => ({ regular: 1, occasional: 0, none: -1 }[v] ?? 0),
      note: (v) =>
        ({
          regular: "Catching issues early extends life",
          occasional: "Some screening helps",
          none: "Skipping checkups means missed early warnings",
        }[v]),
    },
  ];

  const CONDITION_DEFS = {
    hypertension: { label: "Untreated hypertension", delta: -3, note: "Untreated high blood pressure damages the cardiovascular system over time" },
    diabetes: { label: "Diabetes", delta: -6, note: "Diabetes raises cardiovascular and other mortality risks" },
    heart: { label: "Heart disease history", delta: -4, note: "Existing heart disease raises future event risk" },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const form = $("#longevity-form");
  const heightInput = form.elements.height;
  const weightInput = form.elements.weight;
  const bmiOutput = $("#bmi-output");
  const bmiCategory = $("#bmi-category");
  const resultsEl = $("#results");
  const estimateEl = $("#estimate");
  const yearsRemainingEl = $("#years-remaining");
  const factorList = $("#factor-list");
  const recalcBtn = $("#recalc");

  function computeBMI(heightCm, weightKg) {
    if (!heightCm || !weightKg) return null;
    const m = heightCm / 100;
    if (m <= 0) return null;
    return weightKg / (m * m);
  }

  function updateBMIDisplay() {
    const h = parseFloat(heightInput.value);
    const w = parseFloat(weightInput.value);
    const bmi = computeBMI(h, w);
    if (bmi && isFinite(bmi)) {
      bmiOutput.textContent = bmi.toFixed(1);
      const def = FACTOR_DEFS.find((f) => f.key === "bmi");
      bmiCategory.textContent = def.note(bmi);
    } else {
      bmiOutput.textContent = "—";
      bmiCategory.textContent = "";
    }
  }

  heightInput.addEventListener("input", updateBMIDisplay);
  weightInput.addEventListener("input", updateBMIDisplay);

  function readForm() {
    const data = new FormData(form);
    const conditions = data.getAll("conditions");
    return {
      age: parseFloat(data.get("age")),
      sex: data.get("sex"),
      smoking: data.get("smoking"),
      alcohol: data.get("alcohol"),
      exercise: data.get("exercise"),
      diet: data.get("diet"),
      sleep: data.get("sleep"),
      height: parseFloat(data.get("height")),
      weight: parseFloat(data.get("weight")),
      conditions,
      preventive: data.get("preventive"),
      stress: data.get("stress"),
      social: data.get("social"),
      purpose: data.get("purpose"),
    };
  }

  function validate(input) {
    const errors = {};
    if (!isFinite(input.age) || input.age < 0 || input.age > 120) {
      errors.age = "Enter an age between 0 and 120";
    }
    if (!input.sex) errors.sex = "Select an option";
    if (!isFinite(input.height) || input.height < 80 || input.height > 250) {
      errors.height = "Enter a height in cm (80-250)";
    }
    if (!isFinite(input.weight) || input.weight < 20 || input.weight > 400) {
      errors.weight = "Enter a weight in kg (20-400)";
    }
    return errors;
  }

  function showErrors(errors) {
    $$(".error").forEach((el) => (el.textContent = ""));
    $$("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    Object.entries(errors).forEach(([key, msg]) => {
      const errEl = $(`[data-error-for="${key}"]`);
      if (errEl) errEl.textContent = msg;
      const input = form.elements[key];
      if (input) input.setAttribute("aria-invalid", "true");
    });
  }

  function calculate(input) {
    const baseline = BASELINE[input.sex] ?? (BASELINE.female + BASELINE.male) / 2;
    const factors = [];

    FACTOR_DEFS.forEach((def) => {
      const value = def.key === "bmi" ? computeBMI(input.height, input.weight) : input[def.key];
      const delta = def.score(value);
      if (delta !== 0) {
        factors.push({ name: def.label, delta, note: def.note(value) });
      }
    });

    input.conditions.forEach((c) => {
      const def = CONDITION_DEFS[c];
      if (def) factors.push({ name: def.label, delta: def.delta, note: def.note });
    });

    const sum = factors.reduce((acc, f) => acc + f.delta, 0);
    const raw = baseline + sum;
    const estimate = Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, raw));
    const yearsRemaining = Math.max(0, estimate - input.age);

    factors.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return { baseline, estimate, yearsRemaining, factors, sum };
  }

  function formatDelta(d) {
    const rounded = Math.round(d * 10) / 10;
    return (rounded > 0 ? "+" : "") + rounded + " yr" + (Math.abs(rounded) === 1 ? "" : "s");
  }

  function renderResults(result) {
    estimateEl.textContent = result.estimate.toFixed(1);
    yearsRemainingEl.textContent = result.yearsRemaining.toFixed(1);

    factorList.innerHTML = "";
    if (result.factors.length === 0) {
      const li = document.createElement("li");
      li.className = "factor neutral";
      li.innerHTML =
        '<div><span class="factor-name">No major adjustments</span>' +
        '<span class="factor-note">Your answers all sit near the baseline.</span></div>' +
        '<span class="factor-delta">±0</span>';
      factorList.appendChild(li);
    } else {
      result.factors.forEach((f) => {
        const li = document.createElement("li");
        const cls = f.delta > 0 ? "positive" : f.delta < 0 ? "negative" : "neutral";
        li.className = "factor " + cls;
        const main = document.createElement("div");
        const name = document.createElement("span");
        name.className = "factor-name";
        name.textContent = f.name;
        const note = document.createElement("span");
        note.className = "factor-note";
        note.textContent = f.note || "";
        main.append(name, note);
        const delta = document.createElement("span");
        delta.className = "factor-delta";
        delta.textContent = formatDelta(f.delta);
        li.append(main, delta);
        factorList.appendChild(li);
      });
    }

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
    const result = calculate(input);
    renderResults(result);
  });

  form.addEventListener("reset", () => {
    showErrors({});
    resultsEl.classList.add("hidden");
    setTimeout(updateBMIDisplay, 0);
  });

  recalcBtn.addEventListener("click", () => {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstField = form.querySelector("input, select");
    if (firstField) firstField.focus();
  });

  updateBMIDisplay();
})();
