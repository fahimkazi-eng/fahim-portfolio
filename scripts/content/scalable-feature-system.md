Most side projects die of the same thing: every new feature reaches into every other feature until nothing can change without breaking something else. I have started treating "where does this code live?" as a design decision, not a filing task. This is the structure I keep landing on.

## Organise by capability, not by file type

A feature should be able to describe itself in one place. Instead of scattering a feature across `components/`, `hooks/` and `utils/`, I give it a folder:

```
features/notes/
  schema.ts        the shape of the data
  queries.ts       reads
  actions.ts       writes
  components/      the pieces the UI needs
  index.ts         the public surface
```

Everything the rest of the app is allowed to use is re-exported from `index.ts`. The internals stay private. If I need to delete a feature, I delete one folder.

## Start from the schema

Every scalable feature has a data shape, and naming it first forces the hard questions early:

- What is the identity of a record?
- What is required and what is optional?
- What is derived rather than stored?

When the schema is explicit, the queries write themselves and the components stop inventing their own ad-hoc types.

## Keep the write path in one place

Reads can happen wherever they are needed, but writes go through a small, centralised set of server actions. Each action does the same four things, in order:

1. Validate input with a schema
2. Resolve the current user and their permissions
3. Perform the write
4. Revalidate the affected route

Putting those four steps in a single function shape means every new mutation inherits the same safety, and there is exactly one place to audit when something is wrong.

## Make the boundary visible

The best scalability trick I know is a visible boundary. Within a feature folder, code can be as coupled as it likes. Across feature folders, imports only go through the public surface. That one rule keeps a growing codebase navigable, because the number of connections between features stays small enough to hold in your head.

## Reuse at the primitive level, not the feature level

There is a strong temptation to make one big `Dashboard` component that serves four different screens. It always ends badly. Instead, I keep the shared layer small and generic — buttons, inputs, layout primitives, motion helpers — and let each feature compose them differently. Duplication at the feature level is cheap; coupling across features is expensive.

## The test

A structure is working when a new feature can be added without reading the rest of the codebase, and a feature can be removed without hunting for its leftovers. If either of those is hard, the boundaries are in the wrong place — and that is a fix worth making before writing the next feature.
