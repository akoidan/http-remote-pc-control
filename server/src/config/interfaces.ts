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

  getDelayAfter(): number;

  getDelayBefore(): number;

  getVariables(): NonNullable<Variables>;

  setVariable(name: string, value: string | number): Promise<void>;

  getGlobalVars(): Record<string, string | undefined>;
}
