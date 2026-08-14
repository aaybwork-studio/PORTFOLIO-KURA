import type { SchemaTypeDefinition } from "sanity";

import { archiveItem } from "./archiveItem";
import { caseMedia } from "./caseMedia";
import { caseSection } from "./caseSection";
import { infoPage } from "./infoPage";
import { project } from "./project";
import { siteSettings } from "./siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  infoPage,
  project,
  caseSection,
  caseMedia,
  archiveItem,
];

export const schema: { types: SchemaTypeDefinition[] } = { types: schemaTypes };
