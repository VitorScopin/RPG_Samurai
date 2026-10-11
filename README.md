# KAGE NO MICHI — O Caminho das Sombras

RPG de ação **3D em terceira pessoa**, ambientado num Japão feudal fantástico. Protótipo jogável criado com **Three.js** e **Vite**, sem download de modelos, texturas ou serviços externos.

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
| Defesa / aparar | Segurar botão direito ou Q |
| Esquiva | Espaço |
| Interagir | E |
| Poção de cura | F |
| Travar alvo | R |
| Girar câmera | Arrastar mouse |
| Pausar | Esc |
| Mutar áudio | Botão no HUD |

Há controles táteis em telas menores.

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
