// ═══ 开奖流程测试：模拟开始滚动 → 停止揭晓 → 验证结果 ═══
(function() {
  const results = [];

  // ── 1. 检查初始状态 ──
  const startBtn = document.querySelector('button');
  const allBtns = document.querySelectorAll('button');
  results.push('初始按钮数: ' + allBtns.length);

  // 找到"开始滚动"按钮
  const rollBtn = Array.from(allBtns).find(b => b.textContent.includes('开始滚动'));
  if (rollBtn) {
    results.push('✓ 找到开始滚动按钮');
    rollBtn.click();
    results.push('✓ 点击开始滚动');

    // 等待 500ms 让滚动启动
    // 由于 evaluate 是同步的，我们分两步执行
  } else {
    results.push('✗ 未找到开始滚动按钮');
    results.push('所有按钮: ' + Array.from(allBtns).map(b => b.textContent).join(' | '));
  }

  return results.join('\n');
})();
