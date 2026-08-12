import type { SchemaTypeDefinition } from "sanity";

import { archiveItem } from "./archiveItem";
import { caseSection } from "./caseSection";
import { infoPage } from "./infoPage";
import { project } from "./project";
import { siteSettings } from "./siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  infoPage,
  project,
  caseSection,
  archiveItem,
];

export const schema: { types: SchemaTypeDefinition[] } = { types: schemaTypes };
