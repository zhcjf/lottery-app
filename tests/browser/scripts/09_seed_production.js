// 注入测试数据并刷新
localStorage.removeItem('lottery-tool-storage');
localStorage.setItem('lottery-tool-storage', JSON.stringify({
  state: {
    prizeLevels: [
      { id: 'lv1', name: '特等奖', color: '#FF6B6B' },
      { id: 'lv2', name: '一等奖', color: '#FBBF24' },
      { id: 'lv4', name: '三等奖', color: '#34D399' },
    ],
    prizes: [
      { id: 'p1', name: '三等奖', count: 3, allowRepeat: false, scope: 'all', levelId: 'lv4', color: '#34D399' },
    ],
    participants: Array.from({ length: 20 }, (_, i) => ({
      id: 'u' + i, name: '测试用户' + (i + 1),
      department: i < 10 ? '技术部' : '产品部',
    })),
    currentPrizeIndex: 0,
    winners: [],
    phase: 'idle',
    roundCounter: 0,
    mode: 'sequential',
    previewMode: false,
  },
  version: 0,
}));
location.reload();
'ok';
