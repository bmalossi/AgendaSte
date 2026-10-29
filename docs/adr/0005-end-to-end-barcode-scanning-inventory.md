# Leitura Universal de Código de Barras End-to-End no Módulo de Estoque

## Contexto
O salão e clínica de estética gerencia insumos e produtos de revenda que utilizam padrões universais de código de barras (EAN-13, EAN-8, UPC, Code 128). A inserção manual de códigos numéricos de 12 a 14 dígitos gera atrito, lentidão e erros de digitação durante o cadastro e a conferência de estoque na prateleira.

## Decisão de Arquitetura
Adotamos para o módulo de Estoque (`/app?view=inventory`) uma solução híbrida de leitura universal de código de barras composta por:
1. **Modal de Câmera sob Demanda (`BarcodeScannerModal`)**: Utiliza `html5-qrcode` para decodificar formatos 1D e 2D diretamente no navegador/PWA (Chrome, Safari iOS 17+, Edge) utilizando a câmera traseira (`facingMode: "environment"`). O componente gerencia o ciclo de vida da câmera, interrompendo streams ao fechar para preservar a bateria e a privacidade.
2. **Hook de Scanner Físico HID (`useBarcodeScannerListener`)**: Escuta rajadas rápidas de caracteres numéricos seguidas de `Enter` no evento global `keydown`, permitindo que leitores físicos USB ou Bluetooth (tipo pistola ou de bancada) bipem produtos sem necessidade de abrir a câmera ou focar em inputs específicos.
3. **Roteamento Inteligente (Fluxo Duplo)**:
   - Se disparado na listagem de estoque: busca o produto correspondente. Se existir, abre a gaveta de edição do produto com toast informativo; se não existir, abre a gaveta de cadastro já com o código de barras preenchido.
   - Se disparado dentro do formulário de produto: preenche o campo `barcode` com o valor bipado.
4. **Feedback Multissensorial Offline**: Emite bipe sonoro sintetizado em tempo de execução via `Web Audio API` (1760 Hz / 60ms) sem carregar arquivos MP3 externos e aciona vibração tátil no celular via `navigator.vibrate(50)`.

## Consequências
- Zero dependência de aplicativos nativos de lojas de apps (App Store / Google Play).
- Operação 100% plug-and-play para leitores de código de barras físicos sem necessidade de drivers ou emparelhamento complexo.
- Economia de recursos de hardware em dispositivos móveis por não manter feeds de câmera contínuos em segundo plano.
- Base arquitetural desacoplada e pronta para ser estendida à Venda Rápida (PDV) no futuro.

## Adendo de Otimização: Códigos de Barras Lineares 1D (EAN-13, ISBN, UPC)
Códigos 1D lineares possuem requisitos ópticos substancialmente mais rigorosos do que QR Codes (que possuem 3 marcadores de posição 2D bidimensionais). Para garantir sensibilidade instantânea em livros, cosméticos e insumos:
1. **Restrições de Resolução HD (`videoConstraints`)**: A câmera solicita explicitamente `width: { ideal: 1280, max: 1920 }` e `height: { ideal: 720, max: 1080 }` para evitar que barras finas se misturem em resoluções VGA (640x480).
2. **Quadro Completo sem Recorte Restritivo (Remoção do `qrbox`)**: A configuração `qrbox` foi omitida da biblioteca de leitura para que o decodificador analise o quadro inteiro. Isso preserva as "quiet zones" (margens brancas essenciais de no mínimo 9 a 11 módulos nas laterais do código) e evita que o usuário precise enquadrar o código milimetricamente.
3. **Aceleração Nativa Dual-Engine (`BarcodeDetector`)**: Em dispositivos móveis (Android Chrome e Safari 17+), o `BarcodeDetector` nativo em hardware executa diretamente sobre o stream de vídeo a 60fps com tolerância a rotações e sombras, atuando em paralelo ao pipeline JS/ZXing.
4. **Fallback com Upload/Foto em Alta Resolução**: Permite ao usuário carregar uma foto capturada pelo aplicativo de câmera do celular (com autofoco e flash) ou arquivo de imagem.
