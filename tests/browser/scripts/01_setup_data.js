// ═══ 抽奖工具完整流程测试脚本 ═══
// 在浏览器页面上下文中执行，模拟完整抽奖流程

(function() {
  const results = [];

  function log(msg) {
    results.push(msg);
  }

  // ── 1. 清空 localStorage 重新开始 ──
  localStorage.removeItem('lottery-tool-storage');
  log('✓ 清空 localStorage');

  // ── 2. 预填充 store 数据（模拟配置奖项 + 导入名单）──
  const storeData = {
    state: {
      prizes: [
        { id: 'p1', name: '三等奖', count: 5, allowRepeat: false, scope: 'all', level: 3, color: '#CBD5E1' },
        { id: 'p2', name: '二等奖', count: 3, allowRepeat: false, scope: 'all', level: 2, color: '#FBBF24' },
        { id: 'p3', name: '一等奖', count: 1, allowRepeat: false, scope: 'all', level: 1, color: '#FF6B6B' },
      ],
      participants: Array.from({ length: 30 }, (_, i) => ({
        id: 'u' + i,
        name: '测试用户' + (i + 1),
        department: i < 15 ? '技术部' : '产品部',
        group: i < 5 ? '管理层' : i < 10 ? '新员工' : undefined,
      })),
      currentPrizeIndex: 0,
      winners: [],
      phase: 'idle',
      roundCounter: 0,
    },
    version: 0,
  };
  localStorage.setItem('lottery-tool-storage', JSON.stringify(storeData));
  log('✓ 预填充 3 个奖项 + 30 个名单');

  // ── 3. 刷新页面使数据生效 ──
  log('→ 即将刷新页面使数据生效');

  // 输出结果到页面标题
  document.title = 'TEST_RESULTS:' + results.join('|');
  return results.join('\n');
})();
