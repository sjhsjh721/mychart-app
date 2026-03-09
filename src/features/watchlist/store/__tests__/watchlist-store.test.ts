import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWatchlistStore } from "../watchlist-store";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-" + Math.random().toString(36).slice(2, 9)),
});

describe("watchlist-store", () => {
  beforeEach(() => {
    useWatchlistStore.setState({
      groups: [],
      items: {},
      prices: {},
      expandedGroups: new Set(),
    });
  });

  describe("groups", () => {
    it("should start with empty groups", () => {
      expect(useWatchlistStore.getState().groups).toEqual([]);
    });

    it("should add a new group", () => {
      useWatchlistStore.getState().addGroup("관심종목 1");
      const groups = useWatchlistStore.getState().groups;
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe("관심종목 1");
      expect(groups[0].order).toBe(0);
    });

    it("should add multiple groups with correct order", () => {
      const store = useWatchlistStore.getState();
      store.addGroup("그룹 A");
      store.addGroup("그룹 B");
      store.addGroup("그룹 C");

      const groups = useWatchlistStore.getState().groups;
      expect(groups).toHaveLength(3);
      expect(groups[0].order).toBe(0);
      expect(groups[1].order).toBe(1);
      expect(groups[2].order).toBe(2);
    });

    it("should remove a group", () => {
      useWatchlistStore.getState().addGroup("삭제할 그룹");
      const groupId = useWatchlistStore.getState().groups[0].id;

      useWatchlistStore.getState().removeGroup(groupId);
      expect(useWatchlistStore.getState().groups).toHaveLength(0);
    });

    it("should rename a group", () => {
      useWatchlistStore.getState().addGroup("원래 이름");
      const groupId = useWatchlistStore.getState().groups[0].id;

      useWatchlistStore.getState().renameGroup(groupId, "새 이름");
      expect(useWatchlistStore.getState().groups[0].name).toBe("새 이름");
    });

    it("should set groups directly", () => {
      const groups = [
        { id: "g1", name: "그룹1", order: 0 },
        { id: "g2", name: "그룹2", order: 1 },
      ];
      useWatchlistStore.getState().setGroups(groups);
      expect(useWatchlistStore.getState().groups).toEqual(groups);
    });
  });

  describe("items", () => {
    it("should add item to a group", () => {
      useWatchlistStore.getState().addGroup("테스트 그룹");
      const groupId = useWatchlistStore.getState().groups[0].id;

      useWatchlistStore.getState().addItem(groupId, "005930", "삼성전자");

      const items = useWatchlistStore.getState().items[groupId];
      expect(items).toHaveLength(1);
      expect(items[0].symbol).toBe("005930");
      expect(items[0].name).toBe("삼성전자");
    });

    it("should remove item from a group", () => {
      useWatchlistStore.getState().addGroup("테스트");
      const groupId = useWatchlistStore.getState().groups[0].id;
      useWatchlistStore.getState().addItem(groupId, "005930", "삼성전자");

      const itemId = useWatchlistStore.getState().items[groupId][0].id;
      useWatchlistStore.getState().removeItem(groupId, itemId);

      expect(useWatchlistStore.getState().items[groupId]).toHaveLength(0);
    });

    it("should move item between groups", () => {
      const store = useWatchlistStore.getState();
      store.addGroup("그룹 A");
      store.addGroup("그룹 B");

      const groups = useWatchlistStore.getState().groups;
      const groupAId = groups[0].id;
      const groupBId = groups[1].id;

      useWatchlistStore.getState().addItem(groupAId, "005930", "삼성전자");
      const itemId = useWatchlistStore.getState().items[groupAId][0].id;

      useWatchlistStore.getState().moveItem(itemId, groupAId, groupBId);

      expect(useWatchlistStore.getState().items[groupAId]).toHaveLength(0);
      expect(useWatchlistStore.getState().items[groupBId]).toHaveLength(1);
      expect(useWatchlistStore.getState().items[groupBId][0].groupId).toBe(groupBId);
    });

    it("should set items directly", () => {
      const items = [{ id: "i1", groupId: "g1", symbol: "005930", name: "삼성전자", order: 0 }];
      useWatchlistStore.getState().setItems("g1", items);
      expect(useWatchlistStore.getState().items["g1"]).toEqual(items);
    });

    it("should handle moveItem when item does not exist", () => {
      const store = useWatchlistStore.getState();
      store.addGroup("그룹 A");
      store.addGroup("그룹 B");

      const groups = useWatchlistStore.getState().groups;
      const groupAId = groups[0].id;
      const groupBId = groups[1].id;

      // Try to move non-existent item - should not throw
      useWatchlistStore.getState().moveItem("non-existent-id", groupAId, groupBId);

      // State should remain unchanged
      expect(useWatchlistStore.getState().items[groupAId] || []).toHaveLength(0);
      expect(useWatchlistStore.getState().items[groupBId] || []).toHaveLength(0);
    });

    it("should handle removeItem from non-existent group", () => {
      // Remove from group that doesn't exist - should not throw
      useWatchlistStore.getState().removeItem("non-existent-group", "item-id");

      // Should handle gracefully (creates empty array as fallback)
      expect(useWatchlistStore.getState().items["non-existent-group"]).toEqual([]);
    });

    it("should add item to group with no existing items", () => {
      // Add item without first adding a group (items[groupId] is undefined)
      useWatchlistStore.getState().addItem("new-group", "005930", "삼성전자");

      const items = useWatchlistStore.getState().items["new-group"];
      expect(items).toHaveLength(1);
      expect(items[0].symbol).toBe("005930");
    });
  });

  describe("prices", () => {
    it("should update prices", () => {
      useWatchlistStore.getState().updatePrices({
        "005930": { price: 75000, change: 1000, changePercent: 1.35, updatedAt: "2026-03-05" },
      });

      const prices = useWatchlistStore.getState().prices;
      expect(prices["005930"].price).toBe(75000);
      expect(prices["005930"].changePercent).toBe(1.35);
    });

    it("should merge prices", () => {
      useWatchlistStore.getState().updatePrices({
        "005930": { price: 75000, change: 1000, changePercent: 1.35, updatedAt: "2026-03-05" },
      });
      useWatchlistStore.getState().updatePrices({
        "000660": { price: 180000, change: -2000, changePercent: -1.1, updatedAt: "2026-03-05" },
      });

      const prices = useWatchlistStore.getState().prices;
      expect(Object.keys(prices)).toHaveLength(2);
      expect(prices["005930"]).toBeDefined();
      expect(prices["000660"]).toBeDefined();
    });
  });

  describe("expandedGroups", () => {
    it("should toggle group expansion", () => {
      useWatchlistStore.getState().addGroup("테스트");
      const groupId = useWatchlistStore.getState().groups[0].id;

      // Initially not expanded
      expect(useWatchlistStore.getState().expandedGroups.has(groupId)).toBe(false);

      // Toggle to expand
      useWatchlistStore.getState().toggleGroup(groupId);
      expect(useWatchlistStore.getState().expandedGroups.has(groupId)).toBe(true);

      // Toggle to collapse
      useWatchlistStore.getState().toggleGroup(groupId);
      expect(useWatchlistStore.getState().expandedGroups.has(groupId)).toBe(false);
    });
  });
});
