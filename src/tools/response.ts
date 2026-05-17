export function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function errorContent(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    ...jsonContent({
    error: {
      message,
      type: error instanceof Error ? error.name : "Error",
    },
    }),
    isError: true,
  };
}
