import {zodToJsonSchema} from 'zod-to-json-schema';
import {aARootSchema} from '@/config/types/schema';
import {promises as fs} from 'fs';
import path from 'path';

async function main(): Promise<void> {
  const generateSchema = zodToJsonSchema(aARootSchema, 'mySchema');
  const asd = path.resolve(__dirname, '..', '..', 'json-schema.json');
  return fs.writeFile(asd, JSON.stringify(generateSchema, null, 2));
}

void main();
