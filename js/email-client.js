(function () {
  const prepareHostedLinkEmail = ({
    clientEmail = "",
    hostedUrl = "",
    hostedImageUrl = "",
    title = "",
    category = "",
    message = ""
  }) => {
    return {
      provider: "stub",
      status: clientEmail ? "ready-to-send" : "missing-client-email",
      clientEmail,
      subject: `Made For This hosted printable ready: ${title || category || "new asset"}`,
      body: [
        "Hello,",
        "",
        `Your hosted Made For This printable asset is ready.`,
        title ? `Title: ${title}` : "",
        category ? `Category: ${category}` : "",
        hostedUrl ? `Hosted page: ${hostedUrl}` : "",
        hostedImageUrl ? `Hosted image: ${hostedImageUrl}` : "",
        message || "",
        "",
        "Placeholder: connect this payload to Brevo, SendGrid, or a backend endpoint for production sending."
      ]
        .filter(Boolean)
        .join("\n")
    };
  };

  window.MFTEmailClient = { prepareHostedLinkEmail };
})();
