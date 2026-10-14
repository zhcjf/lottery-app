// ═══ 停止揭晓测试 ═══
(function() {
  const results = [];
  const allBtns = document.querySelectorAll('button');
  const stopBtn = Array.from(allBtns).find(b => b.textContent.includes('停止揭晓'));
  if (stopBtn) {
    results.push('✓ 找到停止揭晓按钮');
    stopBtn.click();
    results.push('✓ 点击停止揭晓');
  } else {
    results.push('✗ 未找到停止揭晓按钮');
  }
  return results.join('\n');
})();
