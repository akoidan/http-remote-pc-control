import {generateKeyPairSync, KeyPairSyncResult} from 'crypto';
import {Injectable, Logger} from '@nestjs/common';
import forge from 'node-forge';

@Injectable()
export class CertificateService {
  constructor(
    readonly logger: Logger,
  ) {
  }

  generateKeyPair(): KeyPairSyncResult<string, string> {
    return generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {type: 'spki', format: 'pem'},
      privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
    });
  }

  ca(options?: {
    country?: string;
    state?: string;
    locality?: string;
    organization?: string;
    commonName?: string;
    days?: number;
  }) {
    const opts = {
      country: 'US',
      state: 'CA',
      locality: 'SF',
      organization: 'Example Org',
      commonName: 'Example Root CA',
      days: 3650,
      ...options
    };

    const keys = this.generateKeyPair();
    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.publicKeyFromPem(keys.publicKey);
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + opts.days);

    const attrs = [
      {name: 'commonName', value: opts.commonName},
      {name: 'countryName', value: opts.country},
      {shortName: 'ST', value: opts.state},
      {name: 'localityName', value: opts.locality},
      {name: 'organizationName', value: opts.organization},
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    cert.setExtensions([
      { name: 'basicConstraints', cA: true },
      { name: 'keyUsage', keyCertSign: true, digitalSignature: true, cRLSign: true },
      { name: 'subjectKeyIdentifier' },
    ]);

    cert.sign(forge.pki.privateKeyFromPem(keys.privateKey), forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: forge.pki.certificateToPem(cert)
    };
  }

  client(clientName: string, caKey: string, caCert: string, options?: {
    country?: string;
    state?: string;
    locality?: string;
    organization?: string;
    commonName?: string;
    days?: number;
  }) {
    const opts = {
      country: 'US',
      state: 'CA',
      locality: 'SF',
      organization: 'Example Org',
      commonName: 'localhost',
      days: 365,
      ...options
    };

    const clientKeys = this.generateKeyPair();
    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.publicKeyFromPem(clientKeys.publicKey);
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + opts.days);

    const attrs = [
      {name: 'commonName', value: opts.commonName},
      {name: 'countryName', value: opts.country},
      {shortName: 'ST', value: opts.state},
      {name: 'localityName', value: opts.locality},
      {name: 'organizationName', value: opts.organization},
    ];
    cert.setSubject(attrs);
    
    const caCertificate = forge.pki.certificateFromPem(caCert);
    cert.setIssuer(caCertificate.subject.attributes);
    
    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
      { name: 'subjectAltName', altNames: [{ type: 2, value: '*' }] },
      { name: 'subjectKeyIdentifier' },
      { name: 'authorityKeyIdentifier' },
    ]);

    const caPrivateKey = forge.pki.privateKeyFromPem(caKey);
    cert.sign(caPrivateKey, forge.md.sha256.create());

    return {
      name: clientName,
      key: clientKeys.privateKey,
      cert: forge.pki.certificateToPem(cert),
      caCert: caCert
    };
  }

  all(options?: {
    caOptions?: Parameters<typeof this.ca>[0];
    clientOptions?: Parameters<typeof this.client>[3];
  }) {
    const caData = this.ca(options?.caOptions);
    const serverClient = this.client('server', caData.key, caData.cert, options?.clientOptions);
    const clientClient = this.client('client', caData.key, caData.cert, options?.clientOptions);

    return {
      ca: caData,
      server: serverClient,
      client: clientClient
    };
  }
}
