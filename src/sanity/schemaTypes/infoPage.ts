import { defineArrayMember, defineField, defineType } from "sanity";

export const infoPage = defineType({
  name: "infoPage",
  title: "Info Page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "heading", title: "Heading", type: "text", rows: 2 }),
    defineField({
      name: "badges",
      title: "Badges",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "marqueeWords",
      title: "Marquee words",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "stats",
      title: "Stats",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "statItem",
          fields: [
            defineField({ name: "value", title: "Value", type: "string" }),
            defineField({ name: "label", title: "Label", type: "string" }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
    }),
    defineField({
      name: "bio",
      title: "Bio paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text" })],
    }),
    defineField({
      name: "services",
      title: "What I do",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "serviceItem",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
          ],
          preview: { select: { title: "title", subtitle: "body" } },
        }),
      ],
    }),
    defineField({
      name: "toolkit",
      title: "Toolkit lines",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "glanceLabel",
      title: "At-a-glance heading",
      type: "string",
    }),
    defineField({
      name: "glance",
      title: "At a glance",
      description:
        "Factual label/value rows — availability, location, experience. Replaces the old stats block.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "glanceItem",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "value", title: "Value", type: "text", rows: 2 }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        }),
      ],
    }),
    defineField({ name: "faqLabel", title: "FAQ heading", type: "string" }),
    defineField({ name: "faqIntro", title: "FAQ intro line", type: "string" }),
    defineField({
      name: "faq",
      title: "Questions",
      description:
        "Shown as an accordion. Write the question the way someone would actually ask it.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", title: "Question", type: "string" }),
            defineField({ name: "answer", title: "Answer", type: "text", rows: 5 }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
    }),
    defineField({ name: "contactLabel", title: "Contact column label", type: "string" }),
    defineField({ name: "elsewhereLabel", title: "Elsewhere column label", type: "string" }),
    defineField({ name: "toolkitLabel", title: "Toolkit column label", type: "string" }),
  ],
  preview: {
    prepare: () => ({ title: "Info Page" }),
  },
});
