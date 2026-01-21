export const throwError = (errMessage, statusCode) => {
    const error = new Error(errMessage);
    error.statusCode = statusCode;
    throw error;
}