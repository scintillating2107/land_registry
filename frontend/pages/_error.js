function Error({ statusCode }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "system-ui, sans-serif",
      backgroundColor: "#F8FAFC",
      color: "#0F172A",
    }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        {statusCode ? `Error ${statusCode}` : "An error occurred"}
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        {statusCode === 404
          ? "The page you requested was not found."
          : "Something went wrong. Please try again."}
      </p>
      <a
        href="/"
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#1E3A8A",
          color: "white",
          textDecoration: "none",
          borderRadius: "0.5rem",
          fontWeight: 500,
        }}
      >
        Go home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
