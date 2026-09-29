export enum AiFeature {
  Chat = 'chat',
  ChatTitle = 'chat_title',
  CompleteSql = 'complete_sql',
  Filters = 'filters',
  FixSql = 'fix_sql',
  UpdateSql = 'update_sql',
}

export const aiFeatureLabels: Record<AiFeature, string> = {
  [AiFeature.Chat]: 'Chat',
  [AiFeature.ChatTitle]: 'Chat title',
  [AiFeature.CompleteSql]: 'Complete SQL',
  [AiFeature.Filters]: 'Filters',
  [AiFeature.FixSql]: 'Fix SQL',
  [AiFeature.UpdateSql]: 'Update SQL',
}
