import { defineField, defineType } from "sanity";

export const infoPage = defineType({
  name: "infoPage",
  title: "Info page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "name", title: "Name (large display line)", type: "string" }),
    defineField({
      name: "roleLine",
      title: "Role line",
      type: "string",
      description: "Sits directly under the name. Backslashes read as separators.",
    }),
    defineField({
      name: "bio",
      title: "Bio paragraphs",
      type: "array",
      of: [{ type: "text", rows: 4 }],
    }),

    defineField({ name: "servicesLabel", title: "What-I-do label", type: "string" }),
    defineField({
      name: "services",
      title: "What I do",
      type: "array",
      of: [
        {
          type: "object",
          name: "serviceItem",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
          ],
        },
      ],
    }),

    defineField({ name: "toolkitLabel", title: "Toolkit label", type: "string" }),
    defineField({
      name: "toolkit",
      title: "Toolkit",
      type: "array",
      of: [{ type: "string" }],
      description: "One tool per entry — they render as a dot-separated row.",
    }),

    defineField({ name: "interestsLabel", title: "Interests label", type: "string" }),
    defineField({
      name: "interests",
      title: "Interests",
      type: "array",
      of: [{ type: "string" }],
      description: "Hobbies and interests. One per entry, dot-separated row.",
    }),

    defineField({ name: "faqLabel", title: "FAQ heading", type: "string" }),
    defineField({ name: "faqIntro", title: "FAQ intro line", type: "string" }),
    defineField({
      name: "faq",
      title: "Questions",
      type: "array",
      of: [
        {
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", title: "Question", type: "string" }),
            defineField({ name: "answer", title: "Answer", type: "text", rows: 5 }),
          ],
          preview: { select: { title: "question" } },
        },
      ],
    }),

    defineField({ name: "contactLabel", title: "Contact column label", type: "string" }),
    defineField({ name: "elsewhereLabel", title: "Elsewhere column label", type: "string" }),
    defineField({
      name: "nowPlayingLabel",
      title: "Now-playing label",
      type: "string",
      description: "Heading above the Spotify row.",
    }),
  ],
  preview: { prepare: () => ({ title: "Info page" }) },
});
