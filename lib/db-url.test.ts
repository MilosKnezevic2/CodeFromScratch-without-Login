import { describe, expect, it } from "vitest";
import { toTransactionPooler } from "./db-url";

describe("toTransactionPooler", () => {
  it("moves the Supabase session pooler to transaction mode and keeps everything else", () => {
    expect(toTransactionPooler("postgresql://user.ref:p%40ss@aws-0-eu.pooler.supabase.com:5432/postgres?a=b")).toBe(
      "postgresql://user.ref:p%40ss@aws-0-eu.pooler.supabase.com:6543/postgres?a=b",
    );
  });

  it("leaves an address already in transaction mode alone", () => {
    const url = "postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres";
    expect(toTransactionPooler(url)).toBe(url);
  });

  it("leaves local and other hosts alone", () => {
    for (const url of ["postgresql://u:p@localhost:5432/db", "postgresql://u:p@db.example.com:5432/db"]) {
      expect(toTransactionPooler(url)).toBe(url);
    }
  });

  it("does not hide a missing or broken address", () => {
    expect(toTransactionPooler(undefined)).toBeUndefined();
    expect(toTransactionPooler("not a url")).toBe("not a url");
  });
});
