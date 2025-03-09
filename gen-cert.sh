#!/bin/bash

# Exit script on error
set -e
mkdir -p ./client
mkdir -p ./certs

# Generate CA Key and Certificate
openssl genrsa -out ca-key.pem 2048
openssl req -new -x509 -key ca-key.pem -out ca-cert.pem -days 3650 -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=Example Root CA"

# Generate Server Key and CSR
openssl genrsa -out ./certs/key.pem 2048
openssl req -new -key ./certs/key.pem -out ./certs/csr.pem -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=localhost"

# Sign Server Certificate with CA including SAN
openssl x509 -req -in ./certs/csr.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out ./certs/cert.pem -days 365 -extfile san.cnf -extensions v3_req

# Generate Client Key and CSR
openssl genrsa -out ./client/key.pem 2048
openssl req -new -key ./client/key.pem -out ./client/csr.pem -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=Client"

# Sign Client Certificate with CA
openssl x509 -req -in ./client/csr.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out ./client/cert.pem -days 365
cp ./ca-cert.pem ./client/ca-cert.pem
cp ./ca-cert.pem ./certs/ca-cert.pem
rm ./ca-key.pem
rm ./ca-cert.pem
rm ./ca-cert.srl
rm ./certs/csr.pem
rm ./client/csr.pem
# Output success message
echo "Done!"
