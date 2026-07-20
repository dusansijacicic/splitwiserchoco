import { describe, expect, it } from "vitest";
import { computeTripStats } from "@/lib/stats";

describe("computeTripStats", () => {
  it("sums total, paid, and share per currency", () => {
    const stats = computeTripStats([
      {
        paidBy: "alice",
        currency: "EUR",
        amount: 100,
        participants: [
          { userId: "alice", shareAmount: 60 },
          { userId: "bob", shareAmount: 40 },
        ],
      },
      {
        paidBy: "bob",
        currency: "EUR",
        amount: 20,
        participants: [
          { userId: "alice", shareAmount: 10 },
          { userId: "bob", shareAmount: 10 },
        ],
      },
    ]);

    expect(stats.EUR.total).toBeCloseTo(120);
    expect(stats.EUR.perMember.alice.paid).toBeCloseTo(100);
    expect(stats.EUR.perMember.alice.share).toBeCloseTo(70);
    expect(stats.EUR.perMember.bob.paid).toBeCloseTo(20);
    expect(stats.EUR.perMember.bob.share).toBeCloseTo(50);
  });

  it("keeps currencies separate", () => {
    const stats = computeTripStats([
      { paidBy: "alice", currency: "EUR", amount: 10, participants: [{ userId: "alice", shareAmount: 10 }] },
      { paidBy: "alice", currency: "RSD", amount: 500, participants: [{ userId: "alice", shareAmount: 500 }] },
    ]);

    expect(stats.EUR.total).toBeCloseTo(10);
    expect(stats.RSD.total).toBeCloseTo(500);
  });
});
