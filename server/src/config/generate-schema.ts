import {zodToJsonSchema} from 'zod-to-json-schema';
import {
  aARootSchema,
  macrosDefinitionSchema,
} from '@/config/types/schema';
import {promises as fs} from 'fs';
import path from 'path';

async function main(): Promise<void> {
  const rootSchema = zodToJsonSchema(aARootSchema, 'config');
  const macroSchema = zodToJsonSchema(macrosDefinitionSchema, 'macros');
  const rootSchemaPath = path.resolve(__dirname, '..', '..', 'json-schema.json');
  const macroSchemaPath = path.resolve(__dirname, '..', '..', 'macros-schema.json');
  await Promise.any([
    fs.writeFile(rootSchemaPath, JSON.stringify(rootSchema, null, 2)),
    fs.writeFile(macroSchemaPath, JSON.stringify(macroSchema, null, 2)),
  ]);
}

void main();
