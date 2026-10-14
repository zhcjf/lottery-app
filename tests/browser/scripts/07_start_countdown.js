// 点击"开始开奖"按钮
(function() {
  const btns = document.querySelectorAll('button');
  const startBtn = Array.from(btns).find(b => b.textContent.includes('开始开奖'));
  if (startBtn) {
    startBtn.click();
    return 'clicked start';
  }
  return 'not found: ' + Array.from(btns).map(b => b.textContent).join('|');
})();
