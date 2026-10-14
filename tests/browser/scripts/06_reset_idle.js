// 先清空 localStorage 重新开始
localStorage.removeItem('lottery-tool-storage');

// 预填充测试数据
const storeData = {
  state: {
    prizeLevels: [
      { id: 'lv1', name: '特等奖', color: '#FF6B6B' },
      { id: 'lv2', name: '一等奖', color: '#FBBF24' },
      { id: 'lv3', name: '二等奖', color: '#CBD5E1' },
      { id: 'lv4', name: '三等奖', color: '#CD7F32' },
    ],
    prizes: [
      { id: 'p1', name: '三等奖', count: 3, allowRepeat: false, scope: 'all', levelId: 'lv4', color: '#CD7F32' },
      { id: 'p2', name: '一等奖', count: 1, allowRepeat: false, scope: 'all', levelId: 'lv2', color: '#FBBF24' },
    ],
    participants: Array.from({ length: 20 }, (_, i) => ({
      id: 'u' + i,
      name: '用户' + (i + 1),
      department: i < 10 ? '技术部' : '产品部',
      group: i < 5 ? '管理层' : undefined,
    })),
    currentPrizeIndex: 0,
    winners: [],
    phase: 'idle',
    roundCounter: 0,
  },
  version: 0,
};
localStorage.setItem('lottery-tool-storage', JSON.stringify(storeData));
'reset done';
