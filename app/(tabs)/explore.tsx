import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { Fonts } from '@/constants/theme';

const hero = require('@/assets/images/pleiades-hero.jpg');

export default function AboutScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0B0F18', dark: '#0B0F18' }}
      headerImage={
        <>
          <Image
            source={hero}
            style={styles.headerHero}
            contentFit="cover"
            transition={250}
          />
          {/* overlay para melhorar contraste do texto ao rolar */}
          <ThemedView style={styles.headerOverlay} />
        </>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Sobre o Plêiades
        </ThemedText>
      </ThemedView>

      <ThemedText type="default">
        O Plêiades ajuda você a escolher o melhor dia e horário para atividades
        ao ar livre, usando probabilidades históricas de calor, frio, vento, chuva
        e desconforto térmico — com dados abertos da NASA.
      </ThemedText>

      <Collapsible title="Como funciona">
        <ThemedText>
          • Você informa local (lat/lon), data e opcionalmente período do dia.{'\n'}
          • O app consulta dados históricos (NASA POWER) em uma janela ao redor
          do dia escolhido e calcula a chance de condições “muito quente / fria /
          ventosa / úmida / desconfortável”.{'\n'}
          • Opcional: filtrar por manhã/tarde/noite/madrugada e aplicar tendência
          (comparando anos recentes vs. base histórica).
        </ThemedText>
      </Collapsible>

      <Collapsible title="Dados e fontes">
        <ThemedText>
          • Fonte principal: <ThemedText type="defaultSemiBold">NASA POWER API</ThemedText>{' '}
          (reanálises/observações diárias e horárias).{'\n'}
          • Variáveis típicas: T2M_MAX/MIN (temperatura), RH2M (umidade), WS10M (vento),
          PRECTOTCORR (precipitação), e radiação solar.{'\n'}
          • Planejado (opcional): integração com Giovanni / GES DISC / Worldview.
        </ThemedText>
        <ExternalLink href="https://power.larc.nasa.gov/">
          <ThemedText type="link">POWER • NASA Langley</ThemedText>
        </ExternalLink>
        <ExternalLink href="https://earthdata.nasa.gov/">
          <ThemedText type="link">Earthdata (NASA)</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Check-in Climático (comunidade)">
        <ThemedText>
          Registre “como foi na prática” (ex.: choveu, muito quente, ventou).
          Seus check-ins ficam salvos no dispositivo (offline-first) e podem
          ser exportados em JSON/CSV para formar um dataset comunitário e
          comparar com a climatologia histórica.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Acessibilidade e UX">
        <ThemedText>
          • Cartões com ícones, cores de risco e gráfico em anel para leitura rápida.{'\n'}
          • Alto contraste e textos descritivos.{'\n'}
          • Perfis de atividade ajustam limiares (ex.: praia, trilha, urbano).
        </ThemedText>
      </Collapsible>

      <Collapsible title="Como usar (passo a passo)">
        <ThemedText>
          1) Na tela inicial, toque em “Usar minha localização” ou informe lat/lon.{'\n'}
          2) Escolha a data, um perfil de atividade e (opcional) período do dia.{'\n'}
          3) Toque em “CONSULTAR” para ver as probabilidades e dicas.{'\n'}
          4) (Opcional) Registre um Check-in e exporte JSON/CSV.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Avisos e privacidade">
        <ThemedText>
          • As probabilidades são estimativas históricas (não previsão de curto prazo).{'\n'}
          • Dados de localização são usados apenas para a consulta; check-ins
          ficam no seu aparelho até você exportar.{'\n'}
          • NASA não endossa entidades não-governamentais; respeitamos termos de uso de dados.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Créditos">
        <ThemedText>
          • Dados: NASA POWER / Earthdata.{'\n'}
          • Design e desenvolvimento: Equipe Plêiades.{'\n'}
          • Ícones & UI: componentes Expo e ícones do sistema.
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        {Platform.select({
          ios: (
            <ThemedText style={{ textAlign: 'center', marginTop: 8 }}>
              Header com efeito parallax para uma apresentação mais imersiva.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerHero: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    width: '100%',
    opacity: 0.96
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  }
});
