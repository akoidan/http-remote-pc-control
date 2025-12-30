#!/bin/bash

# Exit script on error
set -e

OUT_DIR=./gencert


HRPC_CA_KEY=$OUT_DIR/ca/ca-key.pem
HRPC_CA_CERT=$OUT_DIR/ca/ca-cert.pem
SAN_CNF=./san.cnf


chp(){
    size=${#1}
    indent=$((25 - $size))
    printf "\e[1;37;40m$1\e[0;36;40m"
    printf " "
    for (( c=1; c<= $indent; c++))  ; do
    printf "."
    done
    printf " \e[0;33;40m$2\n\e[0;37;40m"
}

genCa() {
    mkdir -p $OUT_DIR/ca
    set -x
    openssl genrsa -out $HRPC_CA_KEY 2048
    openssl req -new -x509 -key $HRPC_CA_KEY -out $HRPC_CA_CERT -days 3650 -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=Example Root CA"
    set +x
}

genClient() {
    echo $1
    HRPC_CLIENT_KEY=$OUT_DIR/server/key.pem
    HRPC_CLIENT_CSR=$OUT_DIR/server/csr.pem
    HRPC_CLIENT_CERT=$OUT_DIR/server/cert.pem
    ## Generate Server Key and CSR
    openssl genrsa -out $HRPC_CLIENT_KEY 2048
    openssl req -new -key $HRPC_CLIENT_KEY -out $HRPC_CLIENT_CSR -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=localhost"
    ## Sign Server Certificate with CA including SAN
    openssl x509 -req -in $HRPC_CLIENT_CSR -CA $HRPC_CA_CERT -CAkey $HRPC_CA_KEY -CAcreateserial -out $HRPC_CLIENT_CERT -days 365 -extfile $SAN_CNF -extensions v3_req
    rm $HRPC_CLIENT_CSR
}

# Show help if no arguments
show_help() {
    chp ca "Creates CA (required to generate clients)"
    chp client "Generates client from CA"
    exit 1
}

# Main script logic
if [ $# -eq 0 ]; then
    show_help
fi


case "$1" in
    client)
        genClient "$@"
        ;;
    ca)
        genCa "$@"
        ;;
    *)
        echo "Error: Unknown command '$cmd'"
        show_help
        ;;
esac
