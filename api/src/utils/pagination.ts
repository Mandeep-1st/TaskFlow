export interface PaginationInput {
    page: number;
    limit: number;
}

export const getPagination = ({ page, limit }: PaginationInput) => ({
    skip: (page - 1) * limit,
    take: limit,
});

export const paginatedResponse = <T>(data: T[], total: number, { page, limit }: PaginationInput) => ({
    data,
    total,
    page,
    limit,
});
