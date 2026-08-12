import { defineArrayMember, defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({ name: "kicker", title: "Kicker", type: "string" }),
    defineField({ name: "year", title: "Year", type: "string" }),
    defineField({ name: "role", title: "Role", type: "string" }),
    defineField({ name: "discipline", title: "Discipline", type: "string" }),
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({ name: "comingSoon", title: "Coming soon", type: "boolean", initialValue: false }),
    defineField({
      name: "homeCardLabel",
      title: "Home card label",
      type: "string",
      description: 'e.g. "Project 01 — Product Design"',
    }),
    defineField({
      name: "workCardSubtitle",
      title: "Work card subtitle",
      type: "string",
      description: 'e.g. "Product Design, Motion"',
    }),
    defineField({
      name: "homeAspect",
      title: "Home card aspect ratio",
      type: "string",
      options: { list: ["4 / 3", "3 / 4"], layout: "radio" },
      initialValue: "4 / 3",
    }),
    defineField({ name: "cardImage", title: "Card image", type: "image", options: { hotspot: true } }),
    defineField({ name: "heroImage", title: "Hero image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "sections",
      title: "Case sections",
      type: "array",
      description: "Five sections expected: About, Process, Challenges, Craft, Results.",
      of: [defineArrayMember({ type: "caseSection" })],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "workCardSubtitle", media: "cardImage" },
  },
});
