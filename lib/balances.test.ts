import { describe, expect, it } from "vitest";
import { computeNetBalances, simplifyDebts, simplifyDebtsByCurrency } from "@/lib/balances";

describe("computeNetBalances", () => {
  it("splits an even expense equally between payer and one other", () => {
    const net = computeNetBalances(
      [
        {
          paidBy: "alice",
          currency: "EUR",
          participants: [
            { userId: "alice", shareAmount: 5 },
            { userId: "bob", shareAmount: 5 },
          ],
        },
      ],
      []
    );
    expect(net.EUR.alice).toBeCloseTo(5);
    expect(net.EUR.bob).toBeCloseTo(-5);
  });

  it("handles an uneven split across three people", () => {
    const net = computeNetBalances(
      [
        {
          paidBy: "alice",
          currency: "EUR",
          participants: [
            { userId: "alice", shareAmount: 10 },
            { userId: "bob", shareAmount: 5 },
            { userId: "carol", shareAmount: 15 },
          ],
        },
      ],
      []
    );
    expect(net.EUR.alice).toBeCloseTo(20);
    expect(net.EUR.bob).toBeCloseTo(-5);
    expect(net.EUR.carol).toBeCloseTo(-15);
  });

  it("keeps currencies separate", () => {
    const net = computeNetBalances(
      [
        {
          paidBy: "alice",
          currency: "EUR",
          participants: [
            { userId: "alice", shareAmount: 5 },
            { userId: "bob", shareAmount: 5 },
          ],
        },
        {
          paidBy: "bob",
          currency: "RSD",
          participants: [
            { userId: "alice", shareAmount: 500 },
            { userId: "bob", shareAmount: 500 },
          ],
        },
      ],
      []
    );
    expect(net.EUR.bob).toBeCloseTo(-5);
    expect(net.RSD.alice).toBeCloseTo(-500);
    expect(net.RSD).not.toHaveProperty("carol");
  });

  it("applies a partial settlement to reduce what's owed", () => {
    const net = computeNetBalances(
      [
        {
          paidBy: "alice",
          currency: "EUR",
          participants: [
            { userId: "alice", shareAmount: 10 },
            { userId: "bob", shareAmount: 10 },
          ],
        },
      ],
      [{ paidBy: "bob", paidTo: "alice", amount: 4, currency: "EUR" }]
    );
    expect(net.EUR.bob).toBeCloseTo(-6);
    expect(net.EUR.alice).toBeCloseTo(6);
  });
});

describe("simplifyDebts", () => {
  it("produces a single transaction for a simple two-person debt", () => {
    const tx = simplifyDebts({ alice: 10, bob: -10 });
    expect(tx).toEqual([{ from: "bob", to: "alice", amount: 10 }]);
  });

  it("nets out a fully settled group to zero transactions", () => {
    const tx = simplifyDebts({ alice: 0, bob: 0 });
    expect(tx).toHaveLength(0);
  });

  it("minimizes transactions across three people", () => {
    // alice paid for everyone: bob owes 5, carol owes 15 -> alice is owed 20
    const tx = simplifyDebts({ alice: 20, bob: -5, carol: -15 });
    expect(tx).toHaveLength(2);
    const total = tx.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBeCloseTo(20);
    for (const t of tx) {
      expect(t.to).toBe("alice");
    }
  });

  it("chains a debtor into a creditor who is also a debtor elsewhere", () => {
    // bob owes alice 10, carol owes bob 10 -> should collapse to carol -> alice
    const tx = simplifyDebts({ alice: 10, bob: 0, carol: -10 });
    expect(tx).toEqual([{ from: "carol", to: "alice", amount: 10 }]);
  });
});

describe("simplifyDebtsByCurrency", () => {
  it("simplifies each currency independently", () => {
    const result = simplifyDebtsByCurrency({
      EUR: { alice: 10, bob: -10 },
      RSD: { alice: -500, bob: 500 },
    });
    expect(result.EUR).toEqual([{ from: "bob", to: "alice", amount: 10 }]);
    expect(result.RSD).toEqual([{ from: "alice", to: "bob", amount: 500 }]);
  });
});
