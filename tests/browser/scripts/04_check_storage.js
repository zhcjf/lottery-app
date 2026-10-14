// ═══ 验证 localStorage 持久化 ═══
(function() {
  const results = [];
  const data = JSON.parse(localStorage.getItem('lottery-tool-storage') || '{}');
  const state = data.state || {};
  results.push('winners count: ' + (state.winners ? state.winners.length : 0));
  results.push('phase: ' + state.phase);
  results.push('roundCounter: ' + state.roundCounter);
  if (state.winners && state.winners.length > 0) {
    results.push('first winner: ' + state.winners[0].participantName + ' - ' + state.winners[0].prizeName);
    results.push('last winner: ' + state.winners[state.winners.length - 1].participantName + ' - ' + state.winners[state.winners.length - 1].prizeName);
  }
  return results.join('\n');
})();
