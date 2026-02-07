export function getTextContent(message: {
  parts: Array<{ type: string; text?: string }>;
}): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function getLastUserMessageText(
  messages: Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return getTextContent(messages[i]);
    }
  }
  return null;
}
