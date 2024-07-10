QUESTÃO: Q1
Qual a versão da biblioteca cryptography instalada?

Usando o comando: python3  -c "import cryptography; print(cryptography.__version__)", observamos que a versão da biblioteca cryptography instalada é a 41.0.4

Para correr as funções basta usar «python cfich_chacha20.py setup», «python cfich_chacha20.py encrypt» e «python cfich_chacha20.py decrypt»

QUESTÃO: Q2
Qual o impacto de se considerar um NONCE fixo (e.g. tudo 0)? Que implicações terá essa prática na segurança da cifra?

Um NONCE em criptografia é um número usado para proteger comunicações privadas, evitando ataques de repetição. O NONCE é projetado para ser um valor único para cada mensagem cifrada, e a sua repetição compromete significativamente a segurança do esquema de criptografia. Utilizando um NONCE fixo leva a que se crie uma vulnerabilidade nomeada de "ataque de repetição", ou seja, para entradas de mensagem idênticas, obteremos a mesma saída cifrada. Se um atacante obtiver duas mensagens cifradas usando o mesmo NONCE fixo, ele poderá comparar as saídas cifradas para deduzir informações sobre o conteúdo das mensagens originais. 

Para correr a função basta usar «python chacha20_int_attck.py ataque 0 "o" "x"» 

QUESTÃO: Q3
Qual o impacto de utilizar o programa chacha20_int_attck.py nos criptogramas produzidos pelos programas cfich_aes_cbc.py e cfich_aes_ctr.py? Comente/justifique a resposta.

O programa chacha20_int_attck.py funciona, mas não é possivel decriptar o ficheiro fich.attck, usando o modo CTR, visto que há um problema com o padding ao tentar decriptar o arquivo manipulado pelo ataque, dando o erro "ValueError: Invalid padding bytes.".
Já usando o modo CBC é possível fazer o ataque e decriptar o ficheiro atacado.
