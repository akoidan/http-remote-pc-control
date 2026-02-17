interface AppVersion {
  version: string;
}

interface CliArgs {
  port: number;
  certDir: string;
  cli: boolean;
  logLevel: string;
  generate: boolean;
  createClientTLs?: string;
  ifMissing: boolean;
}

export type {AppVersion, CliArgs};