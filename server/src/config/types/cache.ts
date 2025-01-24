import type {ConfigData} from '@/config/types/schema';
import type {MacroList} from '@/config/types/macros';

export const schemaRootCache: {
  data: ConfigData,
  macros: MacroList,
} = {data: null!, macros: null!};
