export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  content: string
  views: number
  status: string
  author?: string
}

export interface KnowledgeArticleFormValues {
  title: string
  category: string
  content: string
  status: string
}
