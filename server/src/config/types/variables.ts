import {z} from 'zod';

const variablesSchema = z.record(z.union([
  z.string(),
  z.number(),
]).describe('if number, parseInt will be used'));

const variableRegex = /\{\{\w+\}\}/u;

function extractVariableName(variable: unknown): string|undefined {
  if (typeof variable === 'string' && variableRegex.test(variable)) {
    return variable.substring(2, variable.length -2);
  }
  return undefined;
}

const variableValueSchema = z.string().regex(variableRegex)
  .describe('Inject variable with this name. Either can be an environment variable, ' +
    'either a variables passed to a macro from variables section');

type Variables = z.infer<typeof variablesSchema>

export {variablesSchema, variableValueSchema, variableRegex, extractVariableName};

export type {Variables};
