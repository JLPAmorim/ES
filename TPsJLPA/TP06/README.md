# Relatório do Guião da Semana X

## Programas

- PROG: client.js / server.js

Para a execução do TP06, configuramos uma comunicação segura usando TLS entre um cliente e um servidor em Node.js, com várias etapas cruciais para garantir a segurança e autenticação:

- Geração de Certificados: Foi criada uma Autoridade Certificadora (CA) própria para emitir certificados para o servidor e cliente, assegurando uma cadeia de confiança. Foi também utilizado o OpenSSL para gerar as chaves privadas e os certificados públicos de todos os componentes.
- Implementação de Scripts: Devolveram-se os scripts server.js e client.js que utilizam a biblioteca tls do Node.js para estabelecer conexões TLS seguras. Ambos os lados são configurados para exigir autenticação mútua, garantindo que tanto o cliente quanto o servidor sejam validados um pelo outro antes da comunicação.
- Comunicação Bidirecional: Adaptaram-se os scripts para permitir um chat interativo, onde tanto o cliente quanto o servidor podem enviar e receber mensagens continuamente, tornando o sistema um chat bidirecional.
- Segurança e Protocolo: Forçou-se o uso do TLS 1.3 e da cipher-suite TLS_CHACHA20_POLY1305_SHA256 para garantir uma conexão extremamente segura.

Este setup demonstra a implementação de um sistema de chat seguro que não só protege as mensagens contra interceção externa mas também verifica a identidade das partes comunicantes através de certificados confiáveis.
