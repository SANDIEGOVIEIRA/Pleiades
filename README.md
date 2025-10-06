# 🌌 Plêiades – Planejamento Climático Inteligente

O **Plêiades** é um aplicativo mobile desenvolvido com **React Native (Expo)** que ajuda você a escolher o melhor dia e horário para atividades ao ar livre (praia, trilha, pesca, fotografia, etc.), utilizando **dados históricos da NASA POWER API**.

Ele calcula probabilidades de calor, frio, chuva, vento, umidade e desconforto térmico, e permite que a comunidade contribua com **check-ins climáticos** para validar e enriquecer os dados.  

---

## 🚀 Funcionalidades

- 📍 **Busca por local**: Use o GPS ou pesquise locais pelo nome (ex.: "Ponta Verde, Maceió").
- 📅 **Consulta personalizada**: Informe data, período do dia ou horário específico.
- 🔎 **Perfis de atividade**: Praia, trilha, pesca, fotografia, urbano.
- 📊 **Probabilidades históricas**: Gráficos e percentuais claros para cada condição climática.
- 📈 **Aplicar tendências**: Ajuste das probabilidades com base nos últimos anos.
- 🌟 **Sugestão de melhores dias (7 dias)**: Veja quais datas próximas têm as condições mais favoráveis.
- ✍️ **Check-in Climático**: Usuários podem registrar como o tempo realmente estava, criando dados colaborativos.
- 💾 **Armazenamento local (Proof of Concept)**: Simulação de contribuição comunitária sem backend.

---

## 🛠️ Tecnologias Utilizadas

- **React Native + Expo**
- **TypeScript**
- **Expo Router**
- **AsyncStorage** (check-ins locais)
- **Expo Location** (GPS)
- **NASA POWER API** (dados climáticos abertos)
- **Nominatim (OpenStreetMap)** (autocomplete de locais)

---

## 📦 Instalação e Uso

### 1. Clonar o repositório
```bash
git clone https://github.com/SANDIEGOVIEIRA/Pleiades.git
cd Pleiades
````

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npx expo start
```

* **Android**: abra no **Expo Go** escaneando o QR code.
* **iOS**: use a câmera para escanear o QR code e abrir no Expo Go.(se não apresentar opção de scanear basca copiar o endereço que apresenta no terminal e abrir com navegador do celular)

### 4. Gerar APK para testes

```bash
eas build -p android --profile preview
```

---

## 📱 Testar sem instalar dependências

Se você não quiser rodar localmente, também disponibilizamos o APK pronto nos Releases do GitHub.
Basta baixar, instalar no seu dispositivo Android e testar o aplicativo imediatamente.

---

## 📱 Testando no iPhone

1. Instale o app **Expo Go** na App Store.
2. Escaneie o QR code gerado pelo comando `npx expo start`.
3. O app abrirá direto, sem necessidade de build nativa.

---

## 📊 Exemplos de Uso

* Consultar previsão histórica para **praia em Maceió** → escolher melhor horário.
* Filtrar por **tarde** e aplicar **tendência recente**.
* Obter os **3 melhores dias nos próximos 7**.
* Fazer um **check-in climático** para comparar observação real x dado histórico.

---

## 📚 Critérios Atendidos no Hackathon

* **Inovação**: Check-in climático comunitário e gamificação futura.
* **Impacto**: Ajuda pessoas comuns a planejar atividades e evita riscos climáticos.
* **Uso de Dados**: Integração direta com NASA POWER + contribuições de usuários.
* **Execução**: Protótipo funcional completo (consulta, filtros, check-in, sugestões).
* **Apresentação**: Interface intuitiva, clara e envolvente.

---

## 👨‍💻 Autoria

Desenvolvido por **Sandiego, Eduardo, Kelly, Thomas, Khettryenn** da equipe Plêiades no desafio NASA Space Apps 2025 - Recife.
