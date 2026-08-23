import { describe, expect, it } from "vitest";
import { getPagination, paginatedResponse } from "../src/utils/pagination.js";

describe("pagination helpers", () => {
    it("calculates Prisma skip and take values", () => {
        expect(getPagination({ page: 3, limit: 20 })).toEqual({ skip: 40, take: 20 });
    });

    it("returns the required offset-pagination response shape", () => {
        const data = [{ id: 1 }, { id: 2 }];
        expect(paginatedResponse(data, 12, { page: 2, limit: 2 })).toEqual({
            data,
            total: 12,
            page: 2,
            limit: 2,
        });
    });
});
