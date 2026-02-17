interface AppVersion {
  version: string;
}

interface CliArgs {
  port: number;
  certDir: string;
  logLevel: string;
  generate?: boolean;
  createClientTls?: string;
  ifMissing?: boolean;
}

export type {AppVersion, CliArgs};