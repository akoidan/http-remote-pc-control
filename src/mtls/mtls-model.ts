export const CERT_DIR = 'CERT_DIR';


export interface CaResult {
  key: string;
  cert: string;
}

export interface ClientResult {
  key: string;
  cert: string;
  caCert: string;
}

export interface AllResult {
  ca: CaResult;
  client: ClientResult;
  server: ClientResult;
}