const CERT_DIR = 'CERT_DIR';


interface CaResult {
  key: string;
  cert: string;
}

interface ClientResult {
  key: string;
  cert: string;
  caCert: string;
}

export {CERT_DIR};

export type {ClientResult, CaResult};
