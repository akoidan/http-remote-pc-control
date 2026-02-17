import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { createMockLogger } from './test-utils';
import forge from 'node-forge';
import {TlsService} from "../src/mtls/tls-service";

describe('TlsService', () => {
  let service: TlsService;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    mockLogger = createMockLogger();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TlsService,
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TlsService>(TlsService);
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
      const clientData = service.client(caData.key, caData.cert);
      
      expect(clientData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(clientData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(clientData.caCert).toBe(caData.cert);
    });

    it('should create different client certificates for different names', () => {
      const client1 = service.client( caData.key, caData.cert);
      const client2 = service.client( caData.key, caData.cert);
      
      expect(client1.key).not.toBe(client2.key);
      expect(client1.cert).not.toBe(client2.cert);
    });

    it('should create client certificates with hardcoded values', () => {
      const clientData = service.client(caData.key, caData.cert);
      
      const cert = forge.pki.certificateFromPem(clientData.cert);
      const subject = cert.subject.attributes;
      
      expect(subject.find(attr => attr.name === 'commonName')?.value).toBe('localhost');
      expect(subject.find(attr => attr.name === 'countryName')?.value).toBe('US');
      expect(subject.find(attr => attr.shortName === 'ST')?.value).toBe('CA');
      expect(subject.find(attr => attr.name === 'organizationName')?.value).toBe('Example Org');
    });
  });

});
