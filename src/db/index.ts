import Dexie, { type EntityTable } from 'dexie'

// 便签数据结构
export interface StickyNote {
  id: string
  type: string
  position: { x: number; y: number }
  data: { content: string }
  style: { width: string; height: string }
}

// 创建数据库
const db = new Dexie('StickyNotesDB') as Dexie & {
  notes: EntityTable<StickyNote, 'id'>
}

// 定义数据库结构
db.version(1).stores({
  notes: 'id, type'
})

export { db }
