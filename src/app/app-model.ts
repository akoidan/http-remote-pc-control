interface AppVersion {
  version: string;
}

interface CliArgs {
  port: number;
  certDir: string;
  cli: boolean;
  logLevel: string;
  generate: boolean;
  generateClient?: string;
  ifMissing: boolean;
}

export type {AppVersion, CliArgs};