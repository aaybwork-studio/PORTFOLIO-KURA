import { groq } from "next-sanity";

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]{
  heroLine,
  heroPrefix,
  heroPhrases,
  scrollLabel,
  email,
  location,
  timezoneLabel,
  timezoneOffsetMinutes,
  copyright,
  contactEyebrow,
  featuredWorkLabel,
  archiveCtaLabel,
  socials[]{ label, url }
}`;

export const infoPageQuery = groq`*[_type == "infoPage"][0]{
  eyebrow,
  heading,
  badges,
  marqueeWords,
  stats[]{ value, label },
  bio,
  services[]{ title, body },
  toolkit,
  contactLabel,
  elsewhereLabel,
  toolkitLabel
}`;

const projectProjection = groq`{
  title,
  "slug": slug.current,
  kicker,
  year,
  role,
  discipline,
  order,
  comingSoon,
  homeCardLabel,
  workCardSubtitle,
  homeAspect,
  cardImage,
  heroImage,
  sections[]{ kicker, heading, body, note, imageA, imageB }
}`;

export const projectsQuery = groq`*[_type == "project"] | order(order asc) ${projectProjection}`;

export const projectBySlugQuery = groq`*[_type == "project" && slug.current == $slug][0] ${projectProjection}`;

export const archiveQuery = groq`*[_type == "archiveItem"] | order(order asc){
  title,
  image,
  order
}`;
