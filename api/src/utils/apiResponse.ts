class ApiResponse<T = any> {
    public data: T;
    public statusCode: number;
    public message: string;
    public success: boolean;

    constructor(statusCode: number, data: T, message: string = "Success") {
        this.data = data;
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };