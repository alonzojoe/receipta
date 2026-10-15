/**
 * The one localStorage key the receipt draft is written to. The `v1` is the schema
 * version. Lives in `shared/config`, beside `theme_storage_key`, so the legal copy can
 * import it without `shared/` reaching up into a feature: the published page and the
 * code cannot name different keys.
 */
export const draft_storage_key = 'receipta:draft:v1'
