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
    if [ -f "$HRPC_CA_KEY" ]; then
        echo "Error: CA key already exists at $HRPC_CA_KEY"
        echo "To generate a new CA, first remove the existing CA files"
        exit 1
    fi
    mkdir -p $OUT_DIR/ca
    set -x
    openssl genrsa -out $HRPC_CA_KEY 2048
    openssl req -new -x509 -key $HRPC_CA_KEY -out $HRPC_CA_CERT -days 3650 -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=Example Root CA"
    set +x
    echo "CA certificate and key generated successfully in $OUT_DIR/ca/"
}

genClient() {
    local client_name=$1
    if [ -z "$client_name" ]; then
        echo -e "\033[0;31mError: output directory name is required\033[0m"
        show_help
        exit 1
    fi
    mkdir -p $OUT_DIR/$client_name
    HRPC_CLIENT_KEY=$OUT_DIR/$client_name/key.pem
    HRPC_CLIENT_CSR=$OUT_DIR/$client_name/csr.pem
    HRPC_CLIENT_CERT=$OUT_DIR/$client_name/cert.pem
    HRPC_CLIENT_CA_CERT=$OUT_DIR/$client_name/ca-cert.pem
    echo "Generating client certificate in: $OUT_DIR/$client_name"
    ## Generate Server Key and CSR
    set -x
    openssl genrsa -out $HRPC_CLIENT_KEY 2048
    openssl req -new -key $HRPC_CLIENT_KEY -out $HRPC_CLIENT_CSR -subj "/C=US/ST=CA/L=SF/O=Example Org/CN=localhost"
    ## Sign Server Certificate with CA including SAN
    openssl x509 -req -in $HRPC_CLIENT_CSR -CA $HRPC_CA_CERT -CAkey $HRPC_CA_KEY -CAcreateserial -out $HRPC_CLIENT_CERT -days 365 -extfile $SAN_CNF -extensions v3_req
    cp $HRPC_CA_CERT $HRPC_CLIENT_CA_CERT
    set +x
    rm $HRPC_CLIENT_CSR
    echo Created $HRPC_CLIENT_KEY $HRPC_CLIENT_CERT
}

# Show help if no arguments
show_help() {
    chp ca "Creates CA (required to generate clients)"
    chp "client <name>" "Generates client certificate with given name"
    chp clean "Removes $OUT_DIR"
    chp all "Generates CA as well as client and server certificates"
    chp help "Prints this help"
}

# Main script logic
if [ $# -eq 0 ]; then
    echo -e "\033[0;31mError: Command required\033[0m"
    show_help
    exit 1
fi


case "$1" in
    help)
        show_help
        exit 0
        ;;
    client)
        genClient "$2"
        ;;
    ca)
        genCa
        ;;
    clean)
        rm -r $OUT_DIR
        ;;
    all)
        genCa
        genClient server
        genClient client
        ;;
    *)
        echo -e "\033[0;31mError: Unknown command '$1'\033[0m"
        show_help
        exit 1
        ;;
esac
