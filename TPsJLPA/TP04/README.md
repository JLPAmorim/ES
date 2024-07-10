# Relatório do Guião da Semana 04

## Questões

## Programas

- PROG: cfich_nike.js

Em primeiro lugar vamos ver quais os comandos para executar e testar o programa em causa:

- node cfich_nike.js setup alice - Cria a public e private key para a Alice, assim como ficheiro .params com os valores de p e g mencionados no enunciado.
- node cfich_nike.js setup bob - Cria a public e private key para o Bob, assim como ficheiro .params com os valores de p e g mencionados no enunciado.
- node cfich_nike.js enc bob test_file - Cria o ficheiro cifrado
- node cfich_nike.js dec bob test_file.enc - Cria o ficheiro decifrado, obtendo o conteúdo original.

A resolução deste programa começa com a criação da função generateDHKeys, não só gera os pares de chaves Diffie-Hellman mas também guarda os parâmetros criptográficos (p e g), essenciais para assegurar que os mesmos parâmetros são usados em diferentes sessões e operações. Isto é crucial para manter a integridade e segurança dos processos criptográficos. Posteriormente, a função getSharedSecret facilita a geração de um segredo partilhado usando a chave privada de um utilizador e a chave pública de outro, com base no protocolo Diffie-Hellman. Este segredo partilhado é então usado como base para a encriptação e desencriptação, garantindo que apenas as partes com as chaves privadas corretas podem cifrar ou decifrar as mensagens.

Como algoritmo de encriptação, foi usado o AES-GCM, o que não só fornece uma encriptação forte mas também adiciona uma tag de autenticação. Esta tag é usada para assegurar a integridade e autenticidade dos dados durante a desencriptação.
