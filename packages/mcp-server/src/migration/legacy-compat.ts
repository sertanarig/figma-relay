export function createLegacyBridgeShim() {
  return {
    translate(input: { text: string }) {
      return {
        mode: "legacy-shim" as const,
        target: "mcp" as const,
        command: input.text.toLowerCase().includes("token")
          ? "figma_create_variable"
          : "figma_create_node"
      };
    }
  };
}
