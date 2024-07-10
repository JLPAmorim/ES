# Correções pós entrega
Foram feitas pequenas alterações pós entrega que envolve a ação getmsg e alguns prints.

# Funcionalidades Implementadas

- Estabelecimento de uma conexão básica entre cliente e servidor.
- Envio de mensagens entre usuários.
- Visualização da fila de mensagens em espera.
- Leitura de mensagens específicas utilizando UID como argumento.
- Certificados SSL/TLS

## Registo e Login

Implementamos um sistema de registo e login de usuários invés de usar o comando -user FNAME

## Registo Logs

Todas as ações e informações realizadas no sistema são guardadas no ficheiro server.log

## Criptografia e Descriptografia

Utilizamos o algoritmo RSA com padding OAEP e hash SHA-256 para encriptar e decriptar as mensagens enviadas, garantindo a integridade e confidencialidade das informações.

## Certificados SSL/TLS

Os certificados SSL/TLS são utilizados para autenticar e estabelecer conexões seguras entre os clientes e o servidor. Isso garante a identidade dos participantes e protege contra ataques de interceptação.
