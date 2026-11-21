# Créditos e licença dos recursos 3D

O código próprio de Kage no Michi cria o mundo e a jogabilidade. O upgrade
visual usa um **modelo de samurai com skinning e animações** de terceiros,
baixado para sua máquina ao executar \`npm run dev\` / \`npm run assets\`.
Os arquivos binários não ficam versionados no projeto.

## Modelo 3D

- Obra: **Shadowflame Samurai**.
- Artista: **dark_igorek**.
- Fonte original: https://sketchfab.com/3d-models/shadowflame-samurai-03def921ed814b3a9de5c5962b86a45c
- Licença: **Creative Commons Attribution 4.0 International** (CC BY 4.0).
- Licença completa: https://creativecommons.org/licenses/by/4.0/
- Modificações feitas na integração: normalização de escala e orientação,
  adaptação dos materiais PBR, montagem de katana adicional, mudança de
  tonalidade para NPCs, animação de esqueleto e ajuste de deslocamento.

## Preparação e movimentos

- Exportações FBX e palette de materiais do projeto
  https://github.com/achrefelouafi/SamuraiThirdPersonTemplateThreeJS
  criado por **mohamedachrefelouafi** (código do template sob licença MIT).
- Animações: **Mixamo** (Adobe); incluidas na fonte acima.
- Os clipes de Idle / Walk / Run / Slash / Crouch e Jump usam o esqueleto
  correspondente. O projeto baixa esses arquivos somente como recursos do
  próprio jogo, não os oferece como biblioteca separada de animações.
- Revisão fixa da fonte:
  \`496862cda55bfba3be6d02eec5aee3ca808a31a3\`.

## Uso

Mantenha os créditos acima e os termos aplicáveis ao distribuir um jogo
que utilize esses recursos. A licença MIT do código do template não
substitui a licença CC BY do modelo de personagem nem os termos Mixamo.

O carregador conserva os personagens procedurais anteriores caso o
download de FBX / materiais / animações não possa ser realizado.

## Katana texturizada — novo asset GLB

- Arquivo incluído na sincronização: `public/character/weapons/sword.glb` (4.745.912 bytes).
- Origem: https://github.com/achrefelouafi/SamuraiThirdPersonTemplateThreeJS/blob/496862cda55bfba3be6d02eec5aee3ca808a31a3/public/models/weapons/sword.glb
- O GLB da espada foi exportado no mesmo template do corpo, e utiliza a mesma arte/material de origem. Manter os créditos do modelo **Shadowflame Samurai**, de **dark_igorek**, sob **CC BY 4.0** e do template de integração.
- Modificações no jogo: escala automática, alinhamento do comprimento, skinning por ancoragem na mão e fallback procedural caso o arquivo falhe.
- O arquivo é baixado durante `npm run assets`; não está embutido no repositório.

Outros modelos de personagens encontrados online (Sketchfab etc.) **não** foram adicionados sem verificar rig, formato e licença. Para personagens completamente distintos, a próxima etapa exigirá modelos licenciados e testes de retargeting.
