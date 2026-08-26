export type Chapter = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  narration: string;
};

// Sourced from reporting on the 26 August 2026 Bhote Koshi / Lhende Khola
// flash flood in Rasuwa, Nepal (Kathmandu Post, The Himalayan Times,
// OnlineKhabar, Reuters, Fiscal Nepal).
export const CHAPTERS: Chapter[] = [
  {
    id: "source",
    kicker: "01 — The source",
    title: "High above the border, in the ice",
    body: "The water did not begin in Nepal. It began north of the border, in the glaciated headwaters of the Lhende Khola on the Tibetan side of the Himalaya — a tributary that drops steeply into the Bhote Koshi at Rasuwagadhi.",
    narration:
      "The water did not begin in Nepal. It began high above the border, in the glaciated headwaters of the Lhende Khola, on the Tibetan side of the Himalaya. Here, ice, meltwater and loose moraine sit on very steep ground, feeding a narrow tributary that drops into the Bhote Koshi river at Rasuwagadhi.",
  },
  {
    id: "trigger",
    kicker: "02 — The trigger",
    title: "An ice avalanche blocks the river",
    body: "Initial scientific assessment suggests an ice avalanche crashed into the Lhende valley and choked it with debris. Authorities are still investigating whether a glacial lake also burst. Behind the blockage, water stopped moving — and started stacking up.",
    narration:
      "Scientists suspect the trigger was an ice avalanche. A mass of ice and rock collapsed into the Lhende valley and choked it with debris. Authorities are still investigating whether a glacial lake burst as well. Behind that blockage, the river stopped moving, and water began to stack up in the narrow gorge.",
  },
  {
    id: "dam",
    kicker: "03 — The dam",
    title: "A dam nobody designed",
    body: "The debris formed a natural dam: unengineered, unmonitored, and holding back a growing reservoir in a steep gorge. Landslide dams like this rarely hold. Pressure rises, water finds a path through the loose mass, and the channel cuts itself open from the inside.",
    narration:
      "What formed was a dam nobody designed. Unengineered, unmonitored, made of ice and rubble, and holding back a growing lake in a steep gorge. Dams like this almost never hold. Water seeps into the loose mass, finds a path, and begins to cut a channel through it from the inside.",
  },
  {
    id: "breach",
    kicker: "04 — The breach",
    title: "Around 9 a.m., it let go",
    body: "On the morning of 26 August 2026, the blockage failed. Days of stored water were released in minutes as a single wall of debris-laden flood down the Lhende and into the Bhote Koshi — the surge crossed into Nepal at around nine in the morning.",
    narration:
      "On the morning of the twenty sixth of August, twenty twenty six, the blockage failed. What had been stored over hours was released in minutes: a single wall of grey, debris laden water accelerating down the Lhende and into the Bhote Koshi. It crossed into Nepal at around nine in the morning, with almost no warning downstream.",
  },
  {
    id: "impact",
    kicker: "05 — The impact",
    title: "Rasuwagadhi, Timure, Syabrubesi",
    body: "The flood tore through the Rasuwagadhi–Timure border trade hub, sweeping away the customs yard, bridges and more than five hundred vehicles. Settlements and hydropower project sites at Timure and Syabrubesi were damaged or washed away entirely.",
    narration:
      "The flood struck the Rasuwagadhi and Timure border area first: one of Nepal's main overland trade routes with China. The customs yard, bridges and more than five hundred vehicles were swept away. Downstream at Syabrubesi, settlements, markets and hydropower project sites were damaged or washed away entirely.",
  },
  {
    id: "downstream",
    kicker: "06 — Downstream",
    title: "Into the Trishuli",
    body: "The surge carried on from the Bhote Koshi into the Trishuli, reaching Nuwakot and beyond. Security forces and helicopters were mobilised for rescue while authorities warned riverside communities downstream to move to higher ground.",
    narration:
      "The surge did not stop in Rasuwa. It carried down the Bhote Koshi into the Trishuli river, reaching Nuwakot and further downstream. Security forces and helicopters were mobilised for rescue, while authorities warned every community living on the river banks to leave the water and climb to higher ground.",
  },
  {
    id: "meaning",
    kicker: "07 — What it means",
    title: "A warmer Himalaya, a faster river",
    body: "Rasuwa is a pattern, not an accident. As Himalayan ice destabilises, avalanche and glacial-lake dams form and fail more often — and the valleys below now hold roads, border posts and hydropower. Early-warning systems across the trans-boundary basin remain the missing piece.",
    narration:
      "Rasuwa is a pattern, not an accident. As the Himalaya warms, ice becomes less stable, temporary dams form and fail more often, and the valleys below now hold highways, border posts and hydropower plants. The missing piece is warning: sensors and alerts across a border that the water crosses in minutes.",
  },
];
