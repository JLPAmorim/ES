# Respostas das Questões

## Q1

Para verificar se as chaves fornecidas nos ficheiros alice.key e alice.crt constituem de facto um par de chaves RSA válido, basta efetuar a comparação da chave pública derivada da chave privada com a chave pública presente no certificado. Este processo assegura que ambas as chaves fazem parte do mesmo par RSA e que a chave privada corresponde à chave pública no certificado.

Para efetuar a comparação extrai-se a chave pública do certificado com:

- openssl x509 -pubkey -noout -in alice.crt > alice_pubkey.pem

De seguida, para extrair a chave pública da chave privada, utilizamos:

- openssl rsa -pubout -in alice.key -out alice_key_pub.pem -passin pass:1234

Finalmente, comparamos as duas chaves públicas com recurso a:

- fc alice_pubkey.pem alice_key_pub.pem

Se não existirem diferenças reportadas pelo comando fc, podemos concluír que as chaves são iguais e, portanto, que a chave privada e a chave pública do certificado constituem um par válido. No caso dos ficheiros gerados, alice_pubkey.pem e alice_key_pub, o comando fc devolveu:

     Comparing files alice_pubkey.pem and ALICE_KEY_PUB.PEM
     FC: no differences encountered

## Q2

Para a validação dos certificados, tal como é explicado no enunciado, são normalmente efetuados os seguintes passos:

1. Validar período de validade estabelecido no certificado;
2. Validar o titular do certificado;
3. Validar a aplicabilidade do certificado (i.e. se o conteúdo indica que o certificado é aplicável para a utilização pretendida);
4. Validar assinatura contida no certificado -- passo este que, ao necessitar da chave pública (certificado) da EC emitente, pode requerer subir recursivamente na cadeia de certificação até atingir uma trust-anchor (uma entidade em quem se deposita confiança).

Ao verificar o conteúdo dos certificados, de maneira a dar resposta aos passos apresentados, tendo em conta o uso do node-forge para análise dos certificados em Javascript, temos:

1. Validity: Not After:

- Not After - Variável acessível através de cert.valitidy.notAfter
- Not Before - Variável acessível através de cert.valitidy.notBefore

Estes dois campos permitem validar se o prazo de validade dos certificados já expirou ou não.

2. Subject:

- Country (C): Variável acessível através de cert.subject.attributes.name com o nome countryName. Nome do domínio de certificados SSL/TLS ou o nome completo de certificados pessoais.
- State or Province (ST): Variável acessível através de cert.subject.attributes.name com o nome stateOrProvinceName. Informações geográficas sobre a localização da organização ou indivíduo.
- Locality (L): Variável acessível através de cert.subject.attributes.name com o nome localityName. Informações geográficas sobre a localização da organização ou indivíduo.
- Organization (O): Variável acessível através de cert.subject.attributes.name com o nome organiationName. Nome da empresa ou organização a quem o certificado foi emitido.
- Organizational Unit (OU): Variável acessível através de cert.subject.attributes.name com o nome organizationalUnitName. Departamento ou divisão dentro da organização.
- Common Name (CN): Variável acessível através de cert.subject.attributes.name com o nome commonName. Informações geográficas sobre a localização da organização ou indivíduo.

Estes campos dentro do 'subject' permitem validar a identidade do titular do certificado, assegurando que o certificado foi emitido para a entidade correta. Cada atributo desempenha um papel específico na descrição do titular.

3. Extensions:

- Key Usage: Variável acessível através de cert.extensions.name com o nome keyUsage. Define as operações chave permitidas (como assinatura digital, ciframento de chave, etc.). É crucial para determinar se um certificado pode ser usado para assinar digitalmente documentos, cifrar chaves, etc.
- Extended Key Usage: Variável acessível através de cert.extensions.name com o nome extKeyUsage. Fornece uma extensão mais detalhada dos usos para os quais a chave pública do certificado pode ser utilizada. Por exemplo, pode indicar se o certificado é adequado para autenticação SSL/TLS, assinatura de código, autenticação de e-mail, etc.
- Certificate Policies: Variável acessível através de cert.extensions.name com o nome certificatePolicies. Inclui informações sobre as políticas sob as quais o certificado foi emitido. Isso pode incluir detalhes sobre a validade do uso do certificado para determinados propósitos ou em certas indústrias.

## Q3

Validade do Certificado

- Tal como vimos na questão anterior, sobre a validação dos mesmos, existem campos referentes à validade do certificado, campos estes que podem ser alterados, fazendo com que a data atual não esteja dentro da validade.
- É também possível adicionar o certificado a uma lista de certificados revogados, a CRL (Certificate Revocation List), em que no momento da verificação do certificado, se houverem mecanismos de verificação de certificados revogados, iremos obter um erro.
- Finalmente, é possível usar um certificado que não seja emitido por uma autoridade de certificação confiável ou que não esteja encadeado corretamente a uma autoridade raiz confiável.

Validação da Assinatura

- Modificação do conteúdo do ficheiro depois de ter sido assinado, mas antes de verificar a assinatura. Isso fará com que a assinatura seja considerada inválida porque os hashes não coincidirão.
- Alteração direta do conteúdo do ficheiro .sig, modificando a string da assinatura ou inserindo dados corrompidos.

# Relatório do Guião da Semana X

## Programas

- PROG: sig_fich.js

O programa sig_fich.js tem como objetivo assinar digitalmente ficheiros e verificar essas assinaturas, utilizando a biblioteca node-forge do Node.js. Este programa é dividio em duas funções, mais especificamente a função sign e a função verify.

A função sign, que recebe o nome do utilizador (que identifica a chave privada e o certificado correspondente, armazenados como <user>.key e <user>.crt), o nome do ficheiro a ser assinado, e a senha para desencriptar a chave privada. O programa carrega a chave privada do utilizador e o certificado, desencripta a chave privada com a senha fornecida, calcula a assinatura do conteúdo do ficheiro especificado usando RSA com padding PSS, e guarda tanto a assinatura quanto o certificado num novo ficheiro com a extensão .sig. Para executar a função sign, basta chamar o seguinte comando, em que <user> poderá ser "ALICE" e o <file> é "test_file".

- node sig_fich.js sign <user> <file>

A função verify, recebe o nome do ficheiro original que foi assinado e lê o ficheiro .sig correspondente, extrai a assinatura e o certificado, usa a chave pública do certificado para verificar a assinatura do ficheiro original, comparando o hash do ficheiro com a assinatura. No final, mostra se a assinatura é válida ou inválida e, se válida, mostra os dados do signatário (como nome, organização, etc.) extraídos do certificado. Para executar a função verify, basta chamar o seguinte comando, em que o <file> é "test_file".

- node sig_fich.js verify <file>

Nota: É preciso a instalação do node-forge com o comando "npm i node-forge".
