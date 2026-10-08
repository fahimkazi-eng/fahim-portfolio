/* --------------------------------------------------------------------------
   Project categories — the filter vocabulary of the featured-work grid.
   The reference row is ALL / WEB APP / SAAS / E-COMMERCE / EXPERIMENT.
   Admin + the grid read from this one place. A pill only renders when at
   least one published project uses the category, so the row never sells a
   filter with nothing behind it.
   -------------------------------------------------------------------------- */

export const PROJECT_CATEGORIES = [
  { value: "web-app", label: "Web App" },
  { value: "saas", label: "SaaS" },
  { value: "e-commerce", label: "E-Commerce" },
  { value: "experiment", label: "Experiment" },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]["value"];