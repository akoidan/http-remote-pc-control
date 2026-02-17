import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CertificateService } from '../src/certificates/certificate-service';
import { createMockLogger } from './test-utils';

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

  describe('generateKeyPair', () => {
    it('should generate a valid RSA key pair', () => {
      const keyPair = service.generateKeyPair();
      
      expect(keyPair.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(keyPair.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      expect(keyPair.privateKey).toContain('-----END PRIVATE KEY-----');
      expect(keyPair.publicKey).toContain('-----END PUBLIC KEY-----');
    });

    it('should generate different key pairs on subsequent calls', () => {
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();
      
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });
  });

  describe('ca', () => {
    it('should create a CA certificate with default options', () => {
      const caData = service.ca();
      
      expect(caData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(caData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(caData.key).toContain('-----END PRIVATE KEY-----');
      expect(caData.cert).toContain('-----END CERTIFICATE-----');
    });

    it('should create a CA certificate with custom options', () => {
      const customOptions = {
        country: 'DE',
        state: 'Berlin',
        locality: 'Berlin',
        organization: 'Custom Org',
        commonName: 'Custom CA',
        days: 2000
      };
      
      const caData = service.ca(customOptions);
      
      expect(caData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(caData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      
      // Verify certificate contains custom values
      expect(caData.cert).toContain('Custom Org');
      expect(caData.cert).toContain('Custom CA');
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
      
      expect(clientData.name).toBe('test-client');
      expect(clientData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(clientData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(clientData.caCert).toBe(caData.cert);
    });

    it('should create a client certificate with custom options', () => {
      const customOptions = {
        country: 'DE',
        state: 'Berlin',
        locality: 'Berlin',
        organization: 'Custom Org',
        commonName: 'test.example.com',
        days: 500
      };
      
      const clientData = service.client('custom-client', caData.key, caData.cert, customOptions);
      
      expect(clientData.name).toBe('custom-client');
      expect(clientData.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(clientData.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(clientData.caCert).toBe(caData.cert);
    });

    it('should create different client certificates for different names', () => {
      const client1 = service.client('client1', caData.key, caData.cert);
      const client2 = service.client('client2', caData.key, caData.cert);
      
      expect(client1.name).toBe('client1');
      expect(client2.name).toBe('client2');
      expect(client1.key).not.toBe(client2.key);
      expect(client1.cert).not.toBe(client2.cert);
    });

    it('should create different client certificates with same name but different calls', () => {
      const client1 = service.client('same-name', caData.key, caData.cert);
      const client2 = service.client('same-name', caData.key, caData.cert);
      
      expect(client1.name).toBe(client2.name);
      expect(client1.key).not.toBe(client2.key);
      expect(client1.cert).not.toBe(client2.cert);
    });
  });

  describe('all', () => {
    it('should create CA and two clients (server and client)', () => {
      const allData = service.all();
      
      expect(allData.ca).toBeDefined();
      expect(allData.server).toBeDefined();
      expect(allData.client).toBeDefined();
      
      // Check CA
      expect(allData.ca.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(allData.ca.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      
      // Check server client
      expect(allData.server.name).toBe('server');
      expect(allData.server.key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(allData.server.cert).toMatch(/^-----BEGIN CERTIFICATE-----/);
      expect(allData.server.caCert).toBe(allData.ca.cert);
      
      // Check client
      expect(allData.client.name).toBe('client');
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

    it('should create all data with custom options', () => {
      const customOptions = {
        caOptions: {
          country: 'DE',
          organization: 'Custom CA Org',
          commonName: 'Custom Root CA'
        },
        clientOptions: {
          country: 'DE',
          organization: 'Custom Client Org',
          commonName: 'custom.example.com'
        }
      };
      
      const allData = service.all(customOptions);
      
      expect(allData.ca.cert).toContain('Custom CA Org');
      expect(allData.ca.cert).toContain('Custom Root CA');
      expect(allData.server.cert).toContain('Custom Client Org');
      expect(allData.client.cert).toContain('Custom Client Org');
    });
  });

  describe('integration tests', () => {
    it('should create a complete certificate chain that works together', () => {
      const allData = service.all();
      
      // Verify all components exist
      expect(allData.ca.key).toBeTruthy();
      expect(allData.ca.cert).toBeTruthy();
      expect(allData.server.key).toBeTruthy();
      expect(allData.server.cert).toBeTruthy();
      expect(allData.server.caCert).toBeTruthy();
      expect(allData.client.key).toBeTruthy();
      expect(allData.client.cert).toBeTruthy();
      expect(allData.client.caCert).toBeTruthy();
      
      // Verify CA cert is the same for both clients
      expect(allData.server.caCert).toBe(allData.ca.cert);
      expect(allData.client.caCert).toBe(allData.ca.cert);
      
      // Verify server and client have different names
      expect(allData.server.name).toBe('server');
      expect(allData.client.name).toBe('client');
    });

    it('should handle multiple client creation with same CA', () => {
      const caData = service.ca();
      const clients = [];
      
      // Create multiple clients with the same CA
      for (let i = 0; i < 5; i++) {
        const client = service.client(`client-${i}`, caData.key, caData.cert);
        clients.push(client);
      }
      
      // Verify all clients are unique
      const uniqueKeys = new Set(clients.map(c => c.key));
      const uniqueCerts = new Set(clients.map(c => c.cert));
      
      expect(uniqueKeys.size).toBe(5);
      expect(uniqueCerts.size).toBe(5);
      
      // Verify all clients have the same CA cert
      clients.forEach(client => {
        expect(client.caCert).toBe(caData.cert);
      });
    });
  });
});
