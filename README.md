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

## Conteúdo do protótipo

- Cenário procedural com vilarejo, torii, templos, bambus, cerejeiras, névoa, montanhas e iluminação atmosférica.
- Samurai 3D articulado com espada e animações procedurais; câmera terceira pessoa.
- Combate com acerto direcional, defesa, aparada, esquiva, estamina e inimigos com IA simples.
- Missões guiadas pelo Mestre Hideo, três bandidos e confronto final com um Oni.
- Experiência, evolução de nível, moedas, frascos de cura, HUD, minimapa, efeitos e sons sintetizados.
- Salvamento automático local no navegador (`localStorage`).

### Estrutura

- `src/world.js`: ambiente 3D gerado em código.
- `src/actor.js`: personagens e animações.
- `src/main.js`: regras do jogo, missões, IA, controles e interface.
- `src/style.css`: interface e apresentação.

**Estado:** vertical slice / protótipo; modelos e animações são estilizados e gerados via geometria primitiva. Não é um jogo AAA completo, nem inclui rede/multiplayer.
