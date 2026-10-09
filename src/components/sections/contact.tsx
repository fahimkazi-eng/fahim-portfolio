"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUpRight } from "lucide-react";
import { submitContactMessage } from "@/app/actions/contact";
import { idleState, type ActionState } from "@/lib/validations/schemas";
import {
  Field,
  FormStatus,
  Input,
  Select,
  SubmitButton,
  Textarea,
} from "@/components/ui/field";
import { site } from "@/lib/site";
import { Magnetic } from "@/components/ui/magnetic";
import { Spotlight } from "@/components/ui/magnetic";
import { Reveal } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { Section, SectionHeading } from "@/components/ui/card";

/* ==========================================================================
   Contact

   Server Component shell + a small Client Component form. The form is the
   only client boundary; everything around it is static markup.
   ========================================================================== */

/** The brief's project-type vocabulary. Stored as text, not an enum, so the
    admin stays the source of truth and old rows never fail validation. */
const PROJECT_TYPES = [
  "Website",
  "Web App",
  "E-commerce",
  "Dashboard",
  "AI Agent",
  "Other",
] as const;

const PROJECT_STAGES = [
  "Idea",
  "Design",
  "Development",
  "Redesign",
  "Experimental",
] as const;

export function ContactSection() {
  return (
    <Section id="contact">
      <div className="grid grid-cols-1 gap-[clamp(2.5rem,6vw,6rem)] lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            index="/ 12"
            eyebrow="Contact"
            title={<SplitText text="Let's build something great together." duration={1} />}
            lede={
              "Have a product idea, a project to discuss, or an opportunity worth exploring? Tell me what you're working on."
            }
            className="mb-0"
          />

          <Reveal delay={0.1} className="mt-9 space-y-5">
            <div>
              <p className="type-mono mb-2 text-fg-subtle">Direct email</p>
              <a
                href={`mailto:${site.email}`}
                className="group inline-flex items-center gap-2 font-display text-h4 tracking-tight text-fg transition-colors duration-300 hover:text-accent"
              >
                {site.email}
                <ArrowUpRight
                  className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </a>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
              {[
                { term: "Based in", value: site.location },
                { term: "University", value: site.university },
                { term: "Status", value: "Open for Opportunities" },
                { term: "Reply time", value: "Within a few days" },
              ].map((item) => (
                <div key={item.term} className="bg-canvas p-4">
                  <dt className="type-mono text-fg-subtle">{item.term}</dt>
                  <dd className="mt-1 text-[0.875rem] leading-snug text-fg">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}

function ContactForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitContactMessage,
    idleState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful send, but keep the confirmation on
  // screen so the visitor knows it worked.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <Spotlight radius={420} className="rounded-card">
      {/* The wrapper carries the fill (see globals.css) so the cursor glow is
          actually visible rather than hidden behind this form's background. */}
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="relative rounded-card border border-line p-[clamp(1.5rem,3vw,2.5rem)]"
      >
        <ContactFormFields state={state} />
        <ContactFormSubmit />
      </form>
    </Spotlight>
  );
}

function ContactFormFields({ state }: { state: ActionState }) {
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <div className="relative z-10 space-y-1">
      <FormStatus status={state.status} message={state.message} />

      <div className="mt-6 grid gap-x-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={errors?.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            invalid={Boolean(errors?.name)}
            aria-describedby="name-error"
            required
            minLength={2}
            maxLength={120}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors?.email)}
            aria-describedby="email-error"
            required
          />
        </Field>
      </div>

      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field label="Project type" htmlFor="projectType" hint="Optional">
          <Select id="projectType" name="projectType" defaultValue="">
            <option value="">Select a type…</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Project stage" htmlFor="stage" hint="Optional">
          <Select id="stage" name="stage" defaultValue="">
            <option value="">Select a stage…</option>
            {PROJECT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Project description"
        htmlFor="message"
        required
        error={errors?.message}
        hint="10–4000 characters"
      >
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="A few lines about the project, the role, or the question."
          invalid={Boolean(errors?.message)}
          aria-describedby="message-error"
          required
          minLength={10}
          maxLength={4000}
        />
      </Field>

      {/* Honeypot. Hidden from humans and from assistive tech; a bot that
          fills every input will trip it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </div>
  );
}

function ContactFormSubmit() {
  const { pending } = useFormStatus();

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p className="type-mono max-w-[34ch] text-fg-subtle">
        Stored securely. Never shared, never sold.
      </p>
      <Magnetic strength={7}>
        <SubmitButton pending={pending} pendingLabel="Sending">
          Send message
          <ArrowUpRight className="size-4" strokeWidth={2} />
        </SubmitButton>
      </Magnetic>
    </div>
  );
}
