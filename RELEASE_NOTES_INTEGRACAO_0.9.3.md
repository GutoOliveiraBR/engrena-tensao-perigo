# Engrena — Tensão & Perigo 0.9.3 (integração)

API pública adicional `game.engrenaTensaoPerigo.integrationTargets(marker)` e `applyMissionResult({eventId,markerId,target,delta})`.

Os avanços/recuos usam o mesmo cálculo de conclusão e vínculos do módulo. Cada resultado recebe recibo no próprio marcador, persistido com o novo avanço para impedir duplicatas. Requer execução como GM. Sem integração, o módulo funciona como antes.
