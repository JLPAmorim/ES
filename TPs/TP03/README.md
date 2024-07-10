QUESTÃO: Q1
Qual o impacto de executar o programa chacha20_int_attck.py sobre um criptograma produzido por pbenc_chacha20_poly1305.py? Justifique.

Após tentar executar o programa chacha20_int_attck.py e atacar um criptograma produzido pelo pbenc_chacha20_poly1305.py, este criou um ficheiro com um criptograma que supomos que terá a alteração feita. No entanto, ao usar a decriptação do pbenc_chacha20_poly1305.py este dá nos um erro onde indica haver um problema de validação da tag.
A tag de autenticação é gerada automaticamente pela função encrypt quando chamamos chacha.encrypt(nonce, plaintext, None), onde None usa o tamanho padrão para a tag de 16 bytes. Como no ataque manipulamos os bytes do criptograma e alteramos o seu conteúdo (que é usado para calcular a tag), esta irá sofrer alterações. Como é necessário a mesma tag usada para encriptar o texto, após o ataque está já não será válida durante a decriptação.
