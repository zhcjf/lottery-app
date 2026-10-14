// 点击动画选择器按钮，展开动画选择面板
(function() {
  const btns = document.querySelectorAll('button');
  const animBtn = Array.from(btns).find(b => b.textContent.includes('经典滚动'));
  if (animBtn) {
    animBtn.click();
    return 'clicked animation selector';
  }
  return 'not found';
})();
