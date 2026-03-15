export type ToolEntry = {
  id: string;
  title: string;
  description?: string;
};

// Convention:
// - Each tool lives in `tools/<tool-id>/...`
// - The entries below must match the folder names under `tools/`
const TOOL_FOLDER_IDS = ['google-services'] as const;

const humanizeId = (id: string) =>
  id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const TOOLS: ToolEntry[] = TOOL_FOLDER_IDS.map((id) => ({
  id,
  title: humanizeId(id),
  description:
    id === 'google-services'
      ? 'Manage and open your favorite websites in one place, with tabs and history.'
      : undefined,
}));


