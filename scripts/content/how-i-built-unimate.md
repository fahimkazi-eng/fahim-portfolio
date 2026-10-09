UniMate began as a small frustration. Course schedules, assignments, class notes and deadlines all lived in different places, and none of them agreed with each other. The idea was not to build a giant platform. It was to build one screen that could answer a single question well: what actually matters this week?

## Starting from the data model

Most of the early work happened before any UI. I sketched the entities first: a student, the courses they are enrolled in, the assignments attached to those courses, and the sessions that produce the schedule. Getting those relationships right on paper meant the interface later had almost nowhere to be ambiguous.

A simplified version of the shape looks like this:

```
courses(id, student_id, code, title, term)
assignments(id, course_id, title, due_at, status)
sessions(id, course_id, starts_at, ends_at, room)
```

Every screen in the product is essentially a join across those three tables. Once that was clear, the UI stopped being a design problem and became a presentation problem.

## The stack

I kept the stack deliberately boring, because a student product does not need novelty in its plumbing:

- Next.js App Router for routing and server components
- TypeScript across the whole repository
- PostgreSQL as the single source of truth
- Drizzle ORM for a typed schema and typed queries
- Tailwind for the interface layer

The important part is that the types flow from the database to the component. When a column changes, the compiler complains at the places that actually break, rather than at runtime in front of a user.

## Auth and the server boundary

Authentication is scoped to one question: whose rows am I allowed to read? Every query is written from the perspective of the signed-in student, and the session is resolved on the server before any data is fetched. The client never decides what it can see.

That boundary is also why the mutations are server actions. A form posts, the action validates with Zod, writes through Drizzle, and revalidates the affected page. There is no parallel client-side data layer to keep in sync.

## What I would do differently

Two things stand out.

First, I would version the schema migrations from day one instead of editing tables by hand early on. The cost of a migration is tiny; the cost of an unrecorded change is a surprise the day you deploy.

Second, I would design the empty states before the populated ones. A student with no courses yet sees the product at its most honest, and that state is where most of the real user experience lives.

UniMate is still evolving, and that is the point. It is a real product I can point at, break, fix and improve — which teaches more than any tutorial that ends when the demo looks good.
