#!/bin/sh

# [ global parameters ]
# certificate configuration
readonly CERT_DAYS=36500
readonly RSA_STR_LEN=4096
readonly PREFIX={{ appname }}.apps.{{ openshift_url }}-
readonly CERT_DIR=/home/openshift
readonly KEY_DIR=/home/openshift
# certificate content definition
readonly ADDRESS_COUNTRY_CODE=IT
readonly ADDRESS_PREFECTURE=CA
readonly ADDRESS_CITY=CA
readonly COMPANY_NAME=Entando
readonly COMPANY_SECTION=Entando
readonly CERT_PASSWORD= # no password
# - ca
readonly CA_DOMAIN={{ openshift_url }}
readonly CA_EMAIL=s.molino@entando.com
# - server
readonly SERVER_DOMAIN={{ appname }}.apps.{{ openshift_url }}
readonly SERVER_EMAIL=s.molino@entando.com
# - client
readonly CLIENT_DOMAIN=mainline.eng-entando.com
readonly CLIENT_EMAIL=s.molino@entando.com

# [ functions ]
echo_cert_params() {
    local company_domain="$1"
    local company_email="$2"

    echo $ADDRESS_COUNTRY_CODE
    echo $ADDRESS_PREFECTURE
    echo $ADDRESS_CITY
    echo $COMPANY_NAME
    echo $COMPANY_SECTION
    echo $company_domain
    echo $company_email
    echo $CERT_PASSWORD     # password
    echo $CERT_PASSWORD     # password (again)
}
echo_ca_cert_params() {
    echo_cert_params "$CA_DOMAIN" "$CA_EMAIL"
}
echo_server_cert_params() {
    echo_cert_params "$SERVER_DOMAIN" "$SERVER_EMAIL"
}
echo_client_cert_params() {
    echo_cert_params "$CLIENT_DOMAIN" "$CLIENT_EMAIL"
}

# [ main ]
# generate certificates
# - ca
openssl genrsa $RSA_STR_LEN > $KEY_DIR/${PREFIX}ca-key.pem
echo_ca_cert_params | \
    openssl req -new -x509 -nodes -days $CERT_DAYS -key $KEY_DIR/${PREFIX}ca-key.pem -out $CERT_DIR/${PREFIX}ca-cert.pem
# - server
echo_server_cert_params | \
    openssl req -newkey rsa:$RSA_STR_LEN -days $CERT_DAYS -nodes -keyout $KEY_DIR/${PREFIX}server-key.pem -out $CERT_DIR/${PREFIX}server-req.pem
openssl rsa -in $KEY_DIR/${PREFIX}server-key.pem -out $KEY_DIR/${PREFIX}server-key.pem
openssl x509 -req -in $CERT_DIR/${PREFIX}server-req.pem -days $CERT_DAYS -CA $CERT_DIR/${PREFIX}ca-cert.pem -CAkey $KEY_DIR/${PREFIX}ca-key.pem -set_serial 01 -out $CERT_DIR/${PREFIX}server-cert.pem
# - client
echo_client_cert_params | \
    openssl req -newkey rsa:$RSA_STR_LEN -days $CERT_DAYS -nodes -keyout $KEY_DIR/${PREFIX}client-key.pem -out $CERT_DIR/${PREFIX}client-req.pem
openssl rsa -in $KEY_DIR/${PREFIX}client-key.pem -out $KEY_DIR/${PREFIX}client-key.pem
openssl x509 -req -in $CERT_DIR/${PREFIX}client-req.pem -days $CERT_DAYS -CA $CERT_DIR/${PREFIX}ca-cert.pem -CAkey $KEY_DIR/${PREFIX}ca-key.pem -set_serial 01 -out $CERT_DIR/${PREFIX}client-cert.pem

# clean up (before permission changed)
# rm $KEY_DIR/${PREFIX}ca-key.pem
rm $CERT_DIR/${PREFIX}server-req.pem
rm $CERT_DIR/${PREFIX}client-req.pem

# validate permission
#chmod 400 $KEY_DIR/${PREFIX}server-key.pem
#chmod 400 $KEY_DIR/${PREFIX}client-key.pem

# verify relationship among certificates
openssl verify -CAfile $CERT_DIR/${PREFIX}ca-cert.pem $CERT_DIR/${PREFIX}server-cert.pem $CERT_DIR/${PREFIX}client-cert.pem
