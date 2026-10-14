// 点击"停止揭晓"按钮
(function() {
  const btns = document.querySelectorAll('button');
  const stopBtn = Array.from(btns).find(b => b.textContent.includes('停止揭晓'));
  if (stopBtn) {
    stopBtn.click();
    return 'clicked stop';
  }
  return 'not found';
})();
