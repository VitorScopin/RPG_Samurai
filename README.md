# KAGE NO MICHI — O Caminho das Sombras

RPG de ação **3D em terceira pessoa**, ambientado num Japão feudal fantástico. Protótipo jogável criado com **Three.js** e **Vite**, com personagens animados em FBX, texturas PBR e recursos 3D baixados automaticamente na primeira execução.

## Jogar localmente

Requisitos: Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Abra o endereço indicado pelo Vite (normalmente http://localhost:5173). Para gerar a versão de produção: `npm run build`; para visualizá-la: `npm run preview`.

## Controles

| Ação | Tecla / controle |
| --- | --- |
| Caminhar | W A S D ou setas |
| Correr | Shift |
| Atacar | Clique esquerdo ou J |
| Golpe de espírito | K (consome 65% de espírito) |
| Trocar disciplina | 1, 2 ou 3 |
| Defesa / aparar | Segurar botão direito ou Q |
| Esquiva | Espaço |
| Interagir | E |
| Poção de cura | F |
| Travar alvo | R |
| Girar câmera | Arrastar mouse |
| Pausar | Esc |
| Mutar áudio | Botão no HUD |

Há controles táteis em telas menores.

## O Caminho da Lâmina — disciplinas originais

A primeira evolução do combate traz três estilos de espada selecionáveis durante a jornada:

- **1 — Passo da Garça:** ataques precisos contra shinobis ágeis.
- **2 — Corte da Maré:** vantagem ao enfrentar lanceiros ashigaru.
- **3 — Coração da Montanha:** golpes de força contra ronins de armadura pesada.

Cada disciplina dá **35% de dano adicional apenas contra seu adversário correspondente**.
Aparadas perfeitas acumulam **35 pontos de Espírito**, vitórias contra inimigos comuns
concedem **25 pontos**, e derrotar o Oni concede **45**. O Espírito acumula até 100 pontos.
Com pelo menos 65 pontos e 28 de vigor, pressione **K** para um golpe de espírito
mais forte, com alcance levemente ampliado. O HUD mostra disciplina, especialização
e Espírito; no celular, botões próprios alternam a disciplina e ativam o especial.
A escolha de disciplina e o Espírito acumulado são salvos com o progresso.

Esta etapa é um protótipo de combate original inspirado em jogos cinematográficos
de samurai: não utiliza personagens, mapas, assets, nomes ou sequências do jogo de referência.

## Três inimigos animados (nova fase)

A estrada agora reúne **três classes de oponentes** com armas, armaduras,
silhuetas, vida, animações e táticas próprias. A missão inicial do Mestre Hideo
pede derrotar um de cada tipo.

| Inimigo | Modelo e arma | Comportamento |
| --- | --- | --- |
| **Shinobi das Sombras** | Capuz/máscara, tecidos escuros e duas lâminas curtas | Ágil, circula o jogador, ataques rápidos e animação de esquiva ao sofrer dano |
| **Lanceiro Ashigaru** | Jingasa de palha, couraça militar e lança yari | Mantém a distância e usa estocadas mais longas, com aviso antes de atingir |
| **Ronin Corrompido** | Kabuto com chifres, armadura pesada e odachi | Lento, resistente, absorve parte do dano e desfere golpes fortes |

Os três usam **modelos 3D distintos por equipagem modular**: base
humanoide licenciada comum, mas geometria e materiais de equipamentos
individuais ligados aos ossos do esqueleto FBX. As animações originais
(Mixamo) de caminhada, corrida, ataques, golpes pesados e esquiva são
reproduzidas via `THREE.AnimationMixer` e acompanham armas e armaduras.
**Não são três modelos humanos inteiramente independentes importados**;
novas malhas de corpo podem ser integradas em etapa futura.

A resolução do golpe é feita no tempo do jogo, não em `setTimeout`:
pausar/conversar suspende o dano, e acertar o inimigo durante a preparação
pode cancelar o ataque. Sem os arquivos FBX, três aparências procedurais
distintas continuam disponíveis para permitir jogar offline.

- Parâmetros de atributos e comportamento: `src/enemyArchetypes.js`
- Animações e anexos de esqueleto: `src/realisticSamurai.js`
- Combate, IA e integração de missões: `src/main.js`

## Criador de personagem (presets)

Na primeira vez em que clicar em **INICIAR JORNADA**, você entrará no
criador de personagem. É possível reabrir essa tela por
**PERSONALIZAR PERSONAGEM**, no menu principal ou no menu de pausa.

- **6 presets:** Ronin Errante, Kensei, Sombra, Guarda Escarlate,
  Guardião Hayashi e Lua Prateada.
- **Nome próprio** (até 18 caracteres), 8 cores de armadura, 8 cores de detalhes.
- **Acessórios:** nenhum, hachimaki, chapéu kasa ou máscara.
- **Porte físico visual:** ágil, equilibrado ou robusto.
- **Prévia 3D animada:** girar arrastando e pelos botões laterais.
- **Salvar:** aparência e nome ficam persistidos em `localStorage`
  independentemente do progresso da história.

O sistema personaliza o único modelo humanoide disponível por meio de
cores, elementos sobrepostos e ajustes de silhueta. **Não oferece ainda**
malhas alternativas de rosto, cabelo, gênero ou armaduras completas;
isso dependerá de incorporar novos modelos 3D licenciados.

## Novo: samurai realista com animações de esqueleto

A partir desta atualização o jogo carrega um **samurai texturizado (PBR) com
esqueleto real** e utiliza animações FBX para parado, andando, correndo,
atacando, defesa/crouch e esquiva. O samurai, o Mestre Hideo e os três bandidos
compartilham a geometria e as texturas, com tonalidades diferentes para facilitar
a identificação. O chefe Oni ainda é procedural.

A primeira execução de `npm run dev` ou `npm run build` baixa automaticamente
aproximadamente **48 MB** de recursos para `public/character/`. É preciso conexão
com a internet na primeira vez; em execuções seguintes os arquivos já baixados
são reutilizados. Se o download falhar, o jogo continua com o personagem geométrico
anterior como fallback. Também é possível baixar manualmente via:

```bash
npm run assets
```

**Créditos e licenças obrigatórias:** veja [ASSET_CREDITS.md](ASSET_CREDITS.md).
O modelo é do artista dark_igorek (licença CC BY 4.0) e as animações vêm
do pacote Mixamo usado pelo template SamuraiThirdPersonTemplateThreeJS.

## Atualização visual — Vale das Cerejeiras

Esta etapa melhora o mapa 3D diretamente em `src/world.js`:

- **Solo de floresta e trilhas texturizadas:** materiais de aparência orgânica gerados
  uma vez por `CanvasTexture`, com ruído multiescala e fragmentos de folhas.
  Funcionam offline, sem carregar imagens externas durante o jogo.
- **Vegetação e pedras densas:** aproximadamente 1.900 tufos de grama,
  190 pedras e 220 flores com `THREE.InstancedMesh` (poucos draw calls).
  `src/environmentLayout.js` distribui as peças de forma determinística
  sem bloquear a trilha principal, o spawn, as construções ou a lagoa.
- **Cerejeiras detalhadas:** galhos separados e mais de 40 pequenos grupos
  de flores por árvore, também instanciados.
- **Luz cinematográfica:** pôr do sol quente, preenchimento azul frio e
  névoa leve para dar profundidade ao terreno.

O mapa mantém o mesmo posicionamento de inimigos, missão, aldeia, santuário
e colisões. O protótipo continua estilizado: estes ajustes não são
fotogrametria nem visuais AAA.

### Recursos externos selecionados para próximas melhorias

Foi verificada a licença CC0 de **Poly Haven** e **ambientCG**. Para uma
próxima fase com downloads PBR reais, as opções selecionadas são:

- [Forest Ground 05](https://polyhaven.com/a/forest_ground_05) — terra e folhas;
- [Autumn Forest 01](https://polyhaven.com/a/autumn_forest_01) — HDRI florestal;
- [ambientCG](https://ambientcg.com/) — pedras, madeira e materiais PBR.

**Esses assets externos ainda não foram incorporados** nesta etapa; o novo
material procedural offline evita arquivos pesados e dependências de rede.

## Conteúdo do protótipo

- Cenário procedural com vilarejo, torii, templos, bambus, cerejeiras, névoa, montanhas e iluminação atmosférica.
- Samurai rigado e texturizado com movimentos esqueléticos; fallback geométrico; câmera terceira pessoa.
- Combate com acerto direcional, defesa, aparada, esquiva, estamina e inimigos com IA simples.
- Missões guiadas pelo Mestre Hideo, três bandidos e confronto final com um Oni.
- Experiência, evolução de nível, moedas, frascos de cura, HUD, minimapa, efeitos e sons sintetizados.
- Salvamento automático local no navegador (`localStorage`).

### Estrutura

- `src/world.js`: ambiente 3D gerado em código.
- `src/actor.js`: modelos de fallback e animações procedurais.
- `src/realisticSamurai.js`: carregamento e animações de personagens humanoides esqueléticos.
- `scripts/sync-assets.mjs`: downloads verificáveis dos FBX/GLB com cache.
- `src/main.js`: regras do jogo, missões, IA, controles e interface.
- `src/style.css`: interface e apresentação.

**Estado:** protótipo jogável. O herói e os NPCs principais usam um modelo humanoide mais detalhado com clipes de animação quando os recursos estão disponíveis; o cenário e o Oni ainda são procedurais. Ainda não é fotorrealista ou um jogo AAA, e não inclui rede/multiplayer.
