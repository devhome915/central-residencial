# Central Residencial — MVP Node.js + TypeScript

Projeto didático para uma central de eventos domésticos. **Ainda não controla Alexa, Smart Life ou DVR**: os botões simulam eventos.

## Pré-requisitos
- Node.js 22 LTS ou 24 LTS e npm
- Computador e tablet na mesma rede Wi-Fi/LAN

## Instalação
```bash
npm install
```
Copie `.env.example` para `.env` e substitua `API_TOKEN` por uma string aleatória com pelo menos 24 caracteres. Exemplo para gerar no terminal:
```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```
Coloque o valor gerado em `API_TOKEN=`. **Não publique esse arquivo no GitHub.**

## Rodar
```bash
npm run dev
```
No computador: `http://localhost:3000`. No tablet, use `http://IP_DO_COMPUTADOR:3000` (o firewall precisa permitir a porta 3000 na rede privada). Digite o token no painel e clique **Conectar**. Teste os botões; os eventos ficam no arquivo `events.db`.

O painel também tem um atalho para o monitoramento em `http://localhost:3000/cameras.html`. A tela usa os caminhos `camera1` a `camera4` do MediaMTX em `http://IP_DO_COMPUTADOR:8888/<caminho>/`; para abrir em outro dispositivo, o MediaMTX deve estar acessível na rede pela porta 8888. Selecione uma câmera no mosaico para exibi-la em destaque e use **Maximizar** para tela cheia. A página de monitoramento pode ser aberta diretamente; ela não exige o token da API.

Para produção local simples:
```bash
npm run build
npm start
```

## Endpoints
- `GET /health`: saúde do serviço (sem dados sensíveis)
- `GET /api/events`: últimos 50 eventos, exige header `Authorization: Bearer SEU_TOKEN`
- `POST /api/events`: recebe `{ "device": "Portao", "type": "door_open" }`; eventos de dispositivo cadastrado também podem enviar `deviceId` e `source: "device"`
- `DELETE /api/events/:id`: exclui evento autenticado
- `GET /api/devices`, `POST /api/devices`, `DELETE /api/devices/:id`: consulta e mantém o cadastro de dispositivos
- `POST /api/devices/:id/heartbeat`: registra sinal recebido do dispositivo; exige o mesmo header
- `GET /ws`: eventos em tempo real via WebSocket, com protocolo `auth.SEU_TOKEN`

Tipos aceitos: `door_open`, `door_closed`, `motion`.
O estado funcional do cartão é calculado a partir do evento mais recente que permanece no histórico. A conectividade é independente: fica `desconhecida` até receber um evento físico ou heartbeat, `online` por dois minutos após o último sinal e `offline` depois desse período. Eventos simulados não alteram a conectividade.

## Arquitetura
A aplicação foi organizada em camadas para seguir uma abordagem de arquitetura hexagonal/portas e adaptadores:

- domínio: tipos e regras de negócio (`src/domain`)
- portas: contratos de persistência (`src/ports`)
- aplicação: serviços e casos de uso (`src/application`)
- adaptadores: implementação SQLite, entrada HTTP e saída WebSocket (`src/adapters`)

Fluxo: Sensor real (futuro) → adaptador compatível → POST /api/events → serviço → repositório (porta/adapter) → SQLite + WebSocket → painel no tablet.

Isso permite trocar o banco no futuro trocando apenas o adaptador sem alterar a lógica de negócio.

## Estilos do frontend
Os estilos ficam em `public/css`, separados por responsabilidade: `tokens.css` define cores, tipografia, espaçamentos, raios, sombras e transições; os demais arquivos aplicam esses tokens à base, layout, componentes, painel e notificações. Para ajustar a aparência geral, comece alterando os tokens em vez de modificar valores espalhados pelos componentes.

## Próximas etapas (não implementadas)
1. Reparear sensor Smart Life e confirmar se ele expõe eventos pela API Tuya ou por integração local.
2. Testar stream RTSP do DVR Intelbras MHDX 1016, sem expor o DVR à internet.
3. Criar painel React com as cinco câmeras, usando gateway de vídeo adequado (navegadores não reproduzem RTSP diretamente).
4. Integrar alertas e Alexa via serviço compatível, possivelmente Home Assistant.
5. Criar controle de acesso melhor, TLS/reverse proxy e execução como serviço antes de uso contínuo.

## Segurança e limites
- Este é um **protótipo de estudo**, não um sistema de alarme certificado.
- Não encaminhe a porta 3000 nem portas do DVR na internet.
- O token protege as rotas da API, mas não protege as páginas estáticas (`/` e `/cameras.html`) nem as transmissões do MediaMTX. O acesso aos streams depende separadamente da configuração de autenticação e rede do MediaMTX.
- O painel usa HTTP na LAN e mantém o token da API apenas em memória no navegador: use apenas em rede doméstica confiável.
- Reserve um IP no DHCP do roteador para o computador; não é necessário configurar IP estático manualmente.
- Se o computador desligar, os eventos deixarão de ser processados.
