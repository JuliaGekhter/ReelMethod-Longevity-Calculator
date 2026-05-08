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
- `styles.css` — responsive styling (light + dark mode)
- `script.js` — calculation engine and UI logic

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
