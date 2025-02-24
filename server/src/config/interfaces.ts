import type {
  AliasesData,
  IpsData,
} from '@/config/types/schema';
import type {ShortsData} from '@/config/types/shortcut';
import type {MacroList} from '@/config/types/macros';
import type {Variables} from '@/config/types/variables';

export interface ConfigProvider {
  getIps(): IpsData;

  getCombinations(): ShortsData[];

  getAliases(): NonNullable<AliasesData>;

  getMacros(): NonNullable<MacroList>;

  getDelayAfter(): number|undefined;

  getDelayBefore(): number|undefined;

  getVariables(): NonNullable<Variables>;

  setVariable(name: string, value: string | number): Promise<void>;

  getGlobalVars(): Record<string, string | undefined>;
}
