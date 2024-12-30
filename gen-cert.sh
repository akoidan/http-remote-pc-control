#!/bin/bash

# Exit script on error
set -e
mkdir -p ./client/certs
mkdir -p ./server/certs

# Generate CA Key and Certificate
openssl genrsa -out ca-key.pem 2048
openssl req -new -x509 -key ca-key.pem -out ca-cert.pem -days 3650 -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=Example Root CA"

# Generate Server Key and CSR
openssl genrsa -out ./server/certs/key.pem 2048
openssl req -new -key ./server/certs/key.pem -out ./server/certs/csr.pem -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=localhost"

# Sign Server Certificate with CA including SAN
openssl x509 -req -in ./server/certs/csr.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out ./server/certs/cert.pem -days 365 -extfile san.cnf -extensions v3_req


# Generate Client Key and CSR
openssl genrsa -out ./client/certs/key.pem 2048
openssl req -new -key ./client/certs/key.pem -out ./client/certs/csr.pem -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=Client"

# Sign Client Certificate with CA
openssl x509 -req -in ./client/certs/-csr.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out ./client/certs/cert.pem -days 365
cp ./ca-cert.pem ./client/certs/ca-cert.pem
cp ./ca-cert.pem ./server/certs/ca-cert.pem
rm ./ca-key.pem
rm ./ca-cert.pem
rm ./ca-cert.srl
rm ./server/certs/csr.pem
rm ./client/certs/csr.pem
# Output success message
echo "Done!"
