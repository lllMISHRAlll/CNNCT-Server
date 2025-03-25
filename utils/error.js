const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = "CustomError";
  return error;
};

export default createError;
