import { generateKeyPairSync } from 'crypto';
import forge from 'node-forge';
import fs from 'fs';

// CREATION of key pair example
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log(privateKey);
console.log(publicKey);






// Creation of certificate example


// Generate keys
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a self-signed CA cert
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

// Subject and issuer are the same for CA
const attrs = [
  { name: 'commonName', value: 'Example Root CA' },
  { name: 'countryName', value: 'US' },
  { shortName: 'ST', value: 'CA' },
  { name: 'localityName', value: 'SF' },
  { name: 'organizationName', value: 'Example Org' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

// Add extensions
cert.setExtensions([
  { name: 'basicConstraints', cA: true },
  { name: 'keyUsage', keyCertSign: true, digitalSignature: true, cRLSign: true },
  { name: 'subjectKeyIdentifier' },
]);

// Self-sign
cert.sign(keys.privateKey, forge.md.sha256.create());

// Save to files
fs.writeFileSync('ca-key.pem', forge.pki.privateKeyToPem(keys.privateKey));
fs.writeFileSync('ca-cert.pem', forge.pki.certificateToPem(cert));









/// Creation of Client private key, certificate signed by ca, and also copy of ca certificate


// Generate client key
const clientKeys = forge.pki.rsa.generateKeyPair(2048);

// Create CSR
const csr = forge.pki.createCertificationRequest();
csr.publicKey = clientKeys.publicKey;
csr.setSubject([
  { name: 'commonName', value: 'localhost' }
]);
csr.sign(clientKeys.privateKey, forge.md.sha256.create());

// Create client cert signed by CA
const clientCert = forge.pki.createCertificate();
clientCert.serialNumber = '02';
clientCert.validity.notBefore = new Date();
clientCert.validity.notAfter = new Date();
clientCert.validity.notAfter.setFullYear(clientCert.validity.notBefore.getFullYear() + 1);
clientCert.publicKey = clientKeys.publicKey;
clientCert.setSubject(csr.subject.attributes);
clientCert.setIssuer(cert.subject.attributes); // CA issuer
clientCert.setExtensions([
  { name: 'basicConstraints', cA: false },
  { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
  { name: 'extKeyUsage', clientAuth: true, serverAuth: true },
  { name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }] }, // SAN
]);

clientCert.sign(keys.privateKey, forge.md.sha256.create());

// Save files
fs.writeFileSync('client-key.pem', forge.pki.privateKeyToPem(clientKeys.privateKey));
fs.writeFileSync('client-cert.pem', forge.pki.certificateToPem(clientCert));
fs.writeFileSync('ca-cert.pem', forge.pki.certificateToPem(cert));




