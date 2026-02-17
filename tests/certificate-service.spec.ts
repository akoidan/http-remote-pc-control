import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CertificateService } from '../src/certificates/certificate-service';
import { createMockLogger } from './test-utils';
import forge from 'node-forge';

describe('CertificateService', () => {
  let service: CertificateService;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    mockLogger = createMockLogger();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateService,
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<CertificateService>(CertificateService);
  });

  describe('ca', () => {
    it('should create a CA certificate with hardcoded values', () => {
      const caData = service.ca();
      
      expect(caData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(caData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(caData.key).toContain('-----END PRIVATE KEY-----');
      expect(caData.cert).toContain('-----END CERTIFICATE-----');
      
      // Parse certificate and verify hardcoded values
      const cert = forge.pki.certificateFromPem(caData.cert);
      const subject = cert.subject.attributes;
      
      expect(subject.find(attr => attr.name === 'organizationName')?.value).toBe('Example Org');
      expect(subject.find(attr => attr.name === 'commonName')?.value).toBe('Example Root CA');
      expect(subject.find(attr => attr.name === 'countryName')?.value).toBe('US');
      expect(subject.find(attr => attr.shortName === 'ST')?.value).toBe('CA');
    });

    it('should create different CA certificates on subsequent calls', () => {
      const ca1 = service.ca();
      const ca2 = service.ca();
      
      expect(ca1.key).not.toBe(ca2.key);
      expect(ca1.cert).not.toBe(ca2.cert);
    });
  });

  describe('client', () => {
    let caData: ReturnType<typeof service.ca>;

    beforeEach(() => {
      caData = service.ca();
    });

    it('should create a client certificate signed by CA', () => {
      const clientData = service.client('test-client', caData.key, caData.cert);
      
      expect(clientData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(clientData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(clientData.caCert).toBe(caData.cert);
    });

    it('should throw error when client name is not provided', () => {
      expect(() => service.client('', caData.key, caData.cert)).toThrow('Error: output directory name is required');
      expect(() => service.client(null as any, caData.key, caData.cert)).toThrow('Error: output directory name is required');
      expect(() => service.client(undefined as any, caData.key, caData.cert)).toThrow('Error: output directory name is required');
    });

    it('should create different client certificates for different names', () => {
      const client1 = service.client('client1', caData.key, caData.cert);
      const client2 = service.client('client2', caData.key, caData.cert);
      
      expect(client1.key).not.toBe(client2.key);
      expect(client1.cert).not.toBe(client2.cert);
    });

    it('should create client certificates with hardcoded values', () => {
      const clientData = service.client('test-client', caData.key, caData.cert);
      
      const cert = forge.pki.certificateFromPem(clientData.cert);
      const subject = cert.subject.attributes;
      
      expect(subject.find(attr => attr.name === 'commonName')?.value).toBe('localhost');
      expect(subject.find(attr => attr.name === 'countryName')?.value).toBe('US');
      expect(subject.find(attr => attr.shortName === 'ST')?.value).toBe('CA');
      expect(subject.find(attr => attr.name === 'organizationName')?.value).toBe('Example Org');
    });
  });

  describe('all', () => {
    it('should create CA and two clients (server and client)', () => {
      const allData = service.all();
      
      // Check CA
      expect(allData.ca.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(allData.ca.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      
      // Check server client
      expect(allData.server.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(allData.server.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(allData.server.caCert).toBe(allData.ca.cert);
      
      // Check client
      expect(allData.client.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(allData.client.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(allData.client.caCert).toBe(allData.ca.cert);
    });

    it('should create different data on subsequent calls', () => {
      const all1 = service.all();
      const all2 = service.all();
      
      expect(all1.ca.key).not.toBe(all2.ca.key);
      expect(all1.ca.cert).not.toBe(all2.ca.cert);
      expect(all1.server.key).not.toBe(all2.server.key);
      expect(all1.server.cert).not.toBe(all2.server.cert);
      expect(all1.client.key).not.toBe(all2.client.key);
      expect(all1.client.cert).not.toBe(all2.client.cert);
    });
  });
});
