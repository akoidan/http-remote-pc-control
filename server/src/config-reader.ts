import {ConfigData, fullSchema} from '@/types';
import {readFile } from 'fs/promises';
import { join } from 'path';
import {parse} from 'jsonc-parser';

export class ConfigReader {
  async getConfig(): Promise<ConfigData> {
    const content = await readFile(join(__dirname, 'config.jsonc'), 'utf-8');
    const conf = parse(content);
    await fullSchema.parseAsync(conf);
    conf.combinations.map((c: any) => ({
      shortCut: c.shortCut,
      name: c.name,
    })).sort((a: any, b: any) => a.shortCut.localeCompare(b.shortCut)).forEach((c: any) => {
       console.log(`${c.shortCut}: ${c.name}`)
    });
    return conf;
  }
}
