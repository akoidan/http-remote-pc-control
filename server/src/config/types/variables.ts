import {z} from 'zod';

const variablesSchema = z.record(z.union([
  z.string(),
  z.number(),
]).describe('if number, parseInt will be used'));


const variableValueSchema = z.string().regex(/\{\{\w+\}\}/u)
  .describe('Inject variable with this name. Either can be an environment variable, ' +
    'either a variables passed to a macro from variables section');

type Variables = z.infer<typeof variablesSchema>

export {variablesSchema, variableValueSchema};

export type {Variables};
