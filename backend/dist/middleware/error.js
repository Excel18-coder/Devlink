export const errorHandler = (err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
};
