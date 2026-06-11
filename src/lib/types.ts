export type ActivityCategory = 'escola' | 'saude' | 'extracurricular'
export type ActivityStatus = 'pendente' | 'concluido' | 'cancelado'

export interface Child {
  id: string
  user_id: string
  name: string
  birth_date: string | null
  school_name: string | null
  avatar_color: string
  avatar_url: string | null   // photo uploaded to Supabase Storage
  sort_order?: number
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  child_id: string
  category: ActivityCategory
  title: string
  description: string | null
  date: string | null
  time: string | null
  alert_days: number
  status: ActivityStatus
  location: string | null
  recurrence: string | null
  ai_generated: boolean
  takes_user_id: string | null
  picks_user_id: string | null
  created_at: string
  // join
  child?: Child
}

export interface AiInput {
  id: string
  user_id: string
  child_id: string | null
  raw_text: string | null
  image_url: string | null
  extracted_activities: Activity[] | null
  status: 'pending' | 'processed' | 'confirmed'
  created_at: string
}
