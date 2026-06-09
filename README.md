# ReelMethod Longevity Calculator

A single-page, browser-based longevity estimator. Answer a short questionnaire about your lifestyle, body, and wellbeing, and the calculator returns an estimated life expectancy plus a ranked breakdown of which factors are helping or hurting.

No build step, no dependencies, no tracking. Pure HTML, CSS, and vanilla JavaScript.

## Run it

Open `index.html` in any modern browser. That's it.

To serve it over HTTP locally (optional):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project structure

- `index.html` — page structure and form
- `styles.css` — responsive styling (light + dark mode), shared by both pages
- `script.js` — calculation engine and UI logic
- `scholarship.html` — scholarship eligibility checker page
- `scholarship.js` — eligibility rules and UI logic

## Scholarship eligibility checker

`scholarship.html` is a self-service eligibility checker that mirrors the calculator's
design. An applicant answers a short set of yes/no questions and gets an at-a-glance
verdict — *eligible* or *not yet* — with a per-requirement checklist and next steps,
plus a live countdown to the June 19, 2026 deadline.

It checks the published rules: one scholarship per year, no repeat wins of the same
scholarship, registration before the Fall 2026 semester, enrollment in Fall 2026
courses, submission via the official form, **no identifying information in the uploaded
application**, and agreement to public recognition. The checker collects no personal
information and is not an official determination.

Each rule is a small entry in the `REQUIREMENTS` array in `scholarship.js`, so the
logic is transparent and easy to tune. Two values at the top of that file are meant to
be filled in for your deployment:

- `SUBMISSION_FORM_URL` — defaults to `"#"`; set it to the real Scholarship Application
  Submission Form URL.
- `CONTACT_EMAIL` — the questions inbox (`Say-Scholarships@saybrook.edu`).

## How the calculation works

The calculator starts from a baseline life expectancy by sex (US averages, ~75.8 years for males and ~81.1 for females) and applies additive adjustments based on each answer. The final estimate is clamped to a sensible range (50-110 years).

Each factor is implemented as a small scoring function in `script.js`, so the methodology is transparent and easy to tune. Factors include:

- **Lifestyle**: smoking, alcohol, exercise, diet quality, sleep
- **Body**: BMI (computed from height and weight, scored on a J-curve)
- **Health**: untreated hypertension, diabetes, heart disease history, frequency of preventive care
- **Wellbeing**: stress, social connection, sense of purpose

Values are drawn from well-established epidemiological literature on the impact of lifestyle and health factors on mortality. They are population-level averages, not personal predictions.

## Disclaimer

This is an educational tool for self-reflection. It is **not** medical advice and should not replace guidance from a qualified healthcare provider. Individual results vary widely based on genetics, environment, healthcare access, and many factors not captured here.
