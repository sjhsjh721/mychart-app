'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Star } from 'lucide-react';
import { useWatchlistStore } from '../store/watchlist-store';
import { cn } from '@/lib/utils';

export function WatchlistPanel() {
  const { groups, items, prices, expandedGroups, toggleGroup, addGroup, removeGroup, removeItem } = useWatchlistStore();
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const formatChange = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-medium text-sm">관심종목</span>
        </div>
        <button
          onClick={() => setIsAddingGroup(true)}
          className="p-1 hover:bg-accent rounded"
          title="그룹 추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Group Input */}
      {isAddingGroup && (
        <div className="px-3 py-2 border-b border-border">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddGroup();
              if (e.key === 'Escape') setIsAddingGroup(false);
            }}
            placeholder="그룹명 입력..."
            className="w-full px-2 py-1 text-sm border rounded bg-background"
            autoFocus
          />
        </div>
      )}

      {/* Groups */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <Star className="w-8 h-8 mb-2 opacity-50" />
            <p>관심종목을 추가하세요</p>
          </div>
        ) : (
          groups.map((group) => {
            const groupItems = items[group.id] || [];
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className="border-b border-border last:border-0">
                {/* Group Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer group"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({groupItems.length})
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGroup(group.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>

                {/* Items */}
                {isExpanded && (
                  <div className="bg-muted/30">
                    {groupItems.length === 0 ? (
                      <div className="px-6 py-3 text-xs text-muted-foreground">
                        종목을 추가하세요
                      </div>
                    ) : (
                      groupItems.map((item) => {
                        const priceData = prices[item.symbol];
                        const changeColor = priceData
                          ? priceData.changePercent > 0
                            ? 'text-red-500'
                            : priceData.changePercent < 0
                            ? 'text-blue-500'
                            : 'text-muted-foreground'
                          : 'text-muted-foreground';

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-6 py-2 hover:bg-accent cursor-pointer group"
                          >
                            <span className="text-sm">{item.name}</span>
                            <div className="flex items-center gap-3">
                              {priceData ? (
                                <>
                                  <span className="text-sm font-mono">
                                    {formatPrice(priceData.price)}
                                  </span>
                                  <span className={cn('text-xs font-mono', changeColor)}>
                                    {formatChange(priceData.changePercent)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(group.id, item.id);
                                }}
                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded"
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
