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
  name,
  roleLine,
  bio,
  servicesLabel,
  services[]{ title, body },
  toolkitLabel,
  toolkit,
  interestsLabel,
  interests,
  faqLabel,
  faqIntro,
  faq[]{ question, answer },
  contactLabel,
  elsewhereLabel,
  nowPlayingLabel,
  nowPlayingExclude
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
  sections[]{ kicker, heading, body, note, imageA, imageB, media[]{ span, ratio, image, videoUrl, poster, alt } }
}`;

export const projectsQuery = groq`*[_type == "project"] | order(order asc) ${projectProjection}`;

export const projectBySlugQuery = groq`*[_type == "project" && slug.current == $slug][0] ${projectProjection}`;

export const archiveQuery = groq`*[_type == "archiveItem"] | order(order asc){
  title,
  image,
  order,
  kind,
  year,
  note,
  "slug": slug.current,
  gallery[]{ _type, span, image, videoUrl, poster, alt }
}`;

export const archiveItemBySlugQuery = groq`*[_type == "archiveItem" && slug.current == $slug][0]{
  title,
  image,
  order,
  kind,
  year,
  note,
  "slug": slug.current,
  gallery[]{ _type, span, image, videoUrl, poster, alt }
}`;
