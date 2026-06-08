import { createClient } from '@/lib/supabase/server'
import ChildrenClient from './ChildrenClient'

export default async function ChildrenPage() {
  const supabase = await createClient()
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .order('sort_order')

  return <ChildrenClient initialChildren={children ?? []} />
}
