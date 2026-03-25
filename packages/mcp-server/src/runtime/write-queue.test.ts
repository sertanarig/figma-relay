import { describe, expect, it } from "vitest";
import { createWriteQueue } from "./write-queue.js";

describe("write queue", () => {
  it("serializes writes in insertion order", async () => {
    const queue = createWriteQueue();
    const order: string[] = [];

    await Promise.all([
      queue.enqueue("runtime-1", async () => {
        order.push("first");
        return "first";
      }),
      queue.enqueue("runtime-1", async () => {
        order.push("second");
        return "second";
      })
    ]);

    expect(order).toEqual(["first", "second"]);
  });

  it("times out long-running work", async () => {
    const queue = createWriteQueue({ timeoutMs: 10 });

    await expect(
      queue.enqueue("runtime-1", () => new Promise((resolve) => setTimeout(resolve, 50)))
    ).rejects.toThrow("WRITE_TIMEOUT");
  });
});
