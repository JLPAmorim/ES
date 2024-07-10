# Respostas das Questões

## Q1 Qual a versão da biblioteca cryptography instalada?

Tendo em conta que os Guiões irão ser feitos em Javascript (Node.js), iremos recorrer à utilização da biblioteca integrada do Node 'Crypto'. Uma vez que o módulo Crypto está integrado no Node, podemos dizer que a versão deste módulo corresponde à versão do Node.js instalada. Para obter a versão do Node.js instalada, utilizamos o comando 'node -v', obtendo:

v20.11.1

Uma vez que o módulo Crypto está construído em cima da biblioteca OpenSSL, um dos processos nativos que constituí o Node.js, podemos ser mais específicos e obter a versão do OpenSSL ao fazer um simples 'console.log(process.versions)', devolvendo:

openssl: '3.0.5+quic'

Este vai usar as capacidades criptográficas disponibilizadas pelo OpenSSL de maneira a implementar as suas funcionalidades.

## Q2 Qual o impacto de se considerar um NONCE fixo (e.g. tudo 0)? Que implicações terá essa prática na segurança da cifra?

O uso de um nonce fixo tem implicações significativas para a segurança da cifra, sendo considerado de facto uma prática a evitar. O objetivo do nonce em criptografia é o de garantir a unicidade de cada operação de cifragem, mesmo quando a mesma chave é utilizada mais do que uma vez, ajudando a prevenir ataques que comprometam a integridade e a confidencialidade dos dados. Estes ataques correspondem a ataques de repetição, em que se o mesmo nonce for usado para cifrar dois blocos de dados diferentes, utilizando a mesma chave, torna-se possível a observação de padrões de repetição nos dados cifrados. Isto permite que quem está a efetuar o ataque consigar inferir informações sobre os dados encriptados, especialmente se parte dos dados forem conhecidos ou previsíveis.

## Q3 Qual o impacto de utilizar o programa chacha20_int_attck.py nos criptogramas produzidos pelos programas cfich_aes_cbc.py e cfich_aes_ctr.py? Comente/justifique a resposta.

Enquanto que o chacha20_int_attck.js não teria sucesso contra o AES-CBC devido à difusão de alterações através dos blocos, ou seja, o resultado seria uma corrupção indesejada e imprevisível do text odecifrado, o mesmo ataque poderia teoricamente ser aplicado ao AES-CTR. O AES-CTR, operando de maneira similar às cifras de fluxo, permite a manipulação direta de partes do criptograma para alterar o texto decifrado de forma previsível e controlada, em que, ao contrário do AES-CBC, a alteração de um bloco não afeta os outros, permitindo a manipulação de certos dados sem corromper os restantes. Contudo, é importante ressaltar que a eficácia do ataque depende do conhecimento preciso do texto-limpo e a sua localização no criptograma, além da necessidade de medidas de segurança adicionais, como autenticação e integridade de dados, para proteger contra tais manipulações.

# Relatório do Guião da Semana 02

## Questões

No que diz respeito às questões deste primeiro guião, não houve grande dificuldade. Para a Questão 1 e 2, bastou ler a documentação do Node.js de modo a perceber a ligação entre o Node, o OpenSSL e a biblioteca 'Crypto', assim como a explicação do que são nonces na criptografia, mais especificamente para o que são usados e como são usados.

Para a Questão 3, foi necessário pesquisar conteúdo sobre as diferenças de funcionamento entre Chacha20, AES-CBC e AES-CTR para tirar conclusões sobre qual seria o impacto de usar um tipo de ataque tal como o ataque que é descrito no guião.

## Programas

- PROG: cfich_chacha20.js

Relativamente à implementação dos programas pedidos, houve alguma dificuldade em resolver um erro relacionado com o uso do Initialization Vector para uso na chamada da função createCipheriv para o algoritmo de cifra 'chacha20'. De acordo com a documentação que se encontra disponível em várias plataformas, o IV deveria ter 12 bytes, correspondentes ao nonce, no entanto, na documentação do OpenSSL, é feita referência à criação de IV's com 16 bytes, em que os primeiros 4 bytes correspondem a um counter em little-endian. Com esta alteração, o encrypt e decrypt foram efetuados sem erro. Tal como pedido, o nonce é gravado juntamente com o criptograma, neste caso, no início do ficheiro.

Para execução do programa, basta correr o comando 'node cfich_chacha20.js', cujos argumentos corresponderão, na primeira posição, ao nome da função, nomeadamente setup, enc e dec, e os seguintes serão os argumentos de cada uma das funções, tal como apresentado no guião. Exemplo - 'node cfich_chacha20.js enc test_file key'

Ficheiro que contém a chave - "key".

Ficheiro que contém o conteúdo a cifrar - "test_file".

Ficheiro que contém o conteúdo encriptado - "test_file.enc".

Ficheiro que contém o conteúdo encriptado - "test_file.dec".

- PROG: chacha20_int_attck.js

Este programa é bastante trivial com a excepção da função xorBuffers. É feito, tal como nos restantes programas, leituras de ficheiros, tratamento de buffers, neste caso dos conteúdo de ptxtAtPos e newPtxtAtPos, que correspondem, respetivamente, ao fragmento do texto-limpo conhecido e ao fragmento pelo qual o iremos susbtituir. De seguida, é aplicada uma operação XOR para manipular a parte do criptograma em questão, para calcular o fluxo de chave usado para cifrar o fragmento. De seguida, aplicando XOR novamente com um novo fragmento de texto, é criado o novo fragmento do criptograma que dará o resultado final desejado.

Para testar, corre-se o programa chacha20_int_attck.js com por exemplo:

'node chacha20_int_attck.js test_file.enc 6 ipsum cinco'

E de seguida, usa-se a função de decrypt com o algoritmo chacha20 anteriormente usado para decifrar o criptograma alterado, obtendo-se o resultado esperado.

- PROG: cfich_aes_cbc.js e cfich_aes_ctr.js

A implementação destes programas seguiu a estrutura do programa cfich_chacha20.js, em que apenas se alteraram os paths para guardar os ficheiros e os algoritmos de cifra a ser passados nas funções de encrypt e decrypt

- PROG: pbenc_aes_ctr.js

A implementação deste programa segue a mesma estrutura que o programa cfich_aes_ctr, tal como pedido no guião, sendo que agora a nossa encriptação suporta um sistema de Password-Based-Encryption com utilização da KDF PBKDF2, em que podemos cifrar um ficheiro com derivação de uma chave a partir da pass-phrase passada pelo utilizador, deixando assim de ser necessário passar um ficheiro com uma chave como argumento.

Em suma, este guião permitiu ter um primeiro contacto com aquilo que será abordado ao longo do semestre na UC de Engenharia de Segurança, explorando os conceitos de encrypt e decrypt de ficheiros com o uso de diversos algoritmos de cifra assim como da biblioteca built-in de javascript 'Crypto'.
