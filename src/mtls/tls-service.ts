import {generateKeyPairSync, KeyPairSyncResult} from 'crypto';
import {Injectable, Logger} from '@nestjs/common';
import forge from 'node-forge';
import {CaResult, ClientResult, AllResult} from '@/mtls/mtls-model';

@Injectable()
export class TlsService {
  constructor(
    readonly logger: Logger,
  ) {
  }

  private generateKeyPair(): KeyPairSyncResult<string, string> {
    return generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {type: 'spki', format: 'pem'},
      privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
    });
  }

  ca(): CaResult {
    const keys = this.generateKeyPair();
    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.publicKeyFromPem(keys.publicKey);
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + 3650);

    const attrs = [
      {name: 'commonName', value: 'Example Root CA'},
      {name: 'countryName', value: 'US'},
      {shortName: 'ST', value: 'CA'},
      {name: 'localityName', value: 'SF'},
      {name: 'organizationName', value: 'Example Org'},
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    cert.setExtensions([
      {name: 'basicConstraints', cA: true},
      {name: 'keyUsage', keyCertSign: true, digitalSignature: true, cRLSign: true},
      {name: 'subjectKeyIdentifier'},
    ]);

    cert.sign(forge.pki.privateKeyFromPem(keys.privateKey), forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: forge.pki.certificateToPem(cert),
    };
  }

  client(clientName: string, caKey: string, caCert: string): ClientResult {
    if (!clientName) {
      throw new Error('Error: output directory name is required');
    }
    
    const clientKeys = this.generateKeyPair();
    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.publicKeyFromPem(clientKeys.publicKey);
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + 3650);

    const attrs = [
      {name: 'commonName', value: 'localhost'},
      {name: 'countryName', value: 'US'},
      {shortName: 'ST', value: 'CA'},
      {name: 'localityName', value: 'SF'},
      {name: 'organizationName', value: 'Example Org'},
    ];
    cert.setSubject(attrs);
    
    // Set issuer to CA subject from actual CA cert
    const caCertificate = forge.pki.certificateFromPem(caCert);
    cert.setIssuer(caCertificate.subject.attributes);
    
    cert.setExtensions([
      {name: 'basicConstraints', cA: false},
      {name: 'keyUsage', digitalSignature: true, keyEncipherment: true},
      {name: 'subjectAltName', altNames: [{type: 2, value: '*'}]},
      {name: 'subjectKeyIdentifier'},
      {name: 'authorityKeyIdentifier'},
    ]);

    const caPrivateKey = forge.pki.privateKeyFromPem(caKey);
    cert.sign(caPrivateKey, forge.md.sha256.create());

    return {
      key: clientKeys.privateKey,
      cert: forge.pki.certificateToPem(cert),
      caCert,
    };
  }

  all(): AllResult {
    const caData = this.ca();
    const serverClient = this.client('server', caData.key, caData.cert);
    const clientClient = this.client('client', caData.key, caData.cert);

    return {
      ca: caData,
      server: serverClient,
      client: clientClient,
    };
  }
}
