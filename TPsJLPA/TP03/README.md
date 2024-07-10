# Respostas das Questões

## Q1

Tendo em conta que a principal característica da cifra Chacha20-Poly1305 é a integridade e a autenticidade, tal como seria de esperar, o ataque é ineficaz. Qualquer tentativa de manipular o criptograma, tal como aquela que é feita pelo ataque presente em chacha20_int_attck.js, vai ser detetada na fase de verificação de integridade e autenticidade pelo Poly1305 quando se for decifrar o conteúdo do criptograma alvo do ataque, impedindo que o mesmo seja decifrado. Após efetuados os testes, utilizando o ataque chacha20_int_attck.js ao ficheiro test_file.enc, verificou-se de facto que não foi possível decifrar o criptograma, coisa que antes do ataque era possível.

Isto significa então que a inclusão de Poly1305 na cifra ChaCha20 aumenta a segurança, protegendo assim de ataques em que o atacante conhece partes do texto-limpo.

# Relatório do Guião da Semana 03

## Programas

- PROG: pbenc_aes_ctr_hmac.js, pbenc_chacha20_poly1305.js e pbenc_aes_gcm_hmac.js

As resoluções destes programas, em comparação com os programas do guião anterior, foram bastante mais triviais, pelo simples facto de que apenas foi necessário seguir a mesma estrutura seguida no último guião para cada uma das técnicas criptográficas. Tendo resolvido os erros que foram aparecendo no primeiro guião relativamente a versões das ferramentas utilizadas, bastou implementar, para cada um dos programas pedidos, as novas funcionalidades:

- pbenc_aes_ctr_hmac.js: Adicionar 32 bytes para a chave Hmac; derivar agora ambas as chaves com pbkdf2; gerar conteúdo HMAC no encrypt; verificar conteúdo HMAC no decrypt;
- pbenc_chacha20_poly1305.js: Adicionar ao Chacha20 do primeiro guião Password-Based Encryption; Alterar cifra para ChaCha20-Poly1305 e trabalhar com a tag de autenticação;
- pbenc_aes_gcm_hmac.js: Cifra AES-GCM já oferece autenticação de integridade, logo o uso de HMAC não é necessário; tal como na cifra ChaCha20-Poly1305, utiliza-se a tag de autenticação.

- PROG: cbc-mac-attck.js

O programa cbc-mac-attck.js tem como objetivo explorar o ataque ao CBC-MAC para mensagens de comprimentos variáveis. Em primeiro lugar, procedeu-se à alteração do código fornecido em Python para Javascript. De seguida, o objetivo era recriar um ataque em que sabendo os pares de mensagens (m1,tag1) e (m2,tag2), fosse possível criar uma mensagem m3 em que o seu CBC-MAC fosse também ele a tag2. Para obter este resultado, a documentação indica que o que seria preciso fazer seria proceder ao XORing do primeiro bloco de 16 bytes de m2 com a tag1, sendo depois feita a concatenação de m1 com m2, em que o primeiro bloco de m2 é agora o resultado do XORing.

Apesar de o código aparentar representar o processo da manipulação das mensagens e tags corretamente, o resultado de r5 continua a dar False, sendo o resultado esperado True. No entanto, o objetivo que era o de perceber a manipulação das mensagens de maneira a proceder ao ataque ao CBC-MAC foi cumprido.
