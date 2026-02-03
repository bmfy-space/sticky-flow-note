<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { VueFlow, type Node } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useStorage, usePreferredDark, useDebounceFn } from '@vueuse/core'
import { RotateCcw } from 'lucide-vue-next'
import StickyNoteNode from './components/StickyNoteNode.vue'
import { db, type StickyNote } from './db'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/node-resizer/dist/style.css'

// 视口类型定义
interface Viewport {
  x: number
  y: number
  zoom: number
}

// 便签数据（使用 IndexedDB 存储）
const nodes = ref<Node[]>([])
const isLoading = ref(true)

// 默认便签数据
const defaultNote: StickyNote = {
  id: '1',
  type: 'sticky',
  position: { x: 100, y: 100 },
  data: { content: '<h1>Welcome!</h1><p>Double click anywhere or drag to create a note.</p>' },
  style: { width: '300px', height: '250px' }
}

// 从 IndexedDB 加载便签数据
const loadNotes = async () => {
  try {
    const savedNotes = await db.notes.toArray()
    if (savedNotes.length === 0) {
      // 首次使用，添加默认便签
      await db.notes.add(defaultNote)
      nodes.value = [defaultNote as Node]
    } else {
      nodes.value = savedNotes as Node[]
    }
  } catch (error) {
    console.error('加载便签数据失败:', error)
    nodes.value = [defaultNote as Node]
  } finally {
    isLoading.value = false
  }
}

// 防抖保存便签数据到 IndexedDB
const saveNotes = useDebounceFn(async (notesToSave: Node[]) => {
  try {
    // 将 Vue 响应式对象转换为纯 JavaScript 对象，避免 DataCloneError
    const plainNotes = notesToSave.map(node => ({
      id: node.id,
      type: node.type,
      position: { x: node.position.x, y: node.position.y },
      data: { content: node.data?.content || '' },
      style: node.style ? { width: (node.style as any).width, height: (node.style as any).height } : undefined
    }))
    await db.notes.clear()
    await db.notes.bulkAdd(plainNotes as StickyNote[])
  } catch (error) {
    console.error('保存便签数据失败:', error)
  }
}, 500)

// 监听便签数据变化并保存
watch(nodes, (newNodes) => {
  if (!isLoading.value) {
    saveNotes(newNodes)
  }
}, { deep: true })

// 持久化视口位置（缩放和平移）- 保持使用 localStorage
const savedViewport = useStorage<Viewport>('sticky-notes-viewport', { x: 0, y: 0, zoom: 1 }, localStorage)

const isDark = usePreferredDark()

const edges = ref([])

const vueFlowInstance = ref<any>(null)

// 防抖保存视口位置，避免频繁写入 localStorage
const saveViewport = useDebounceFn((viewport: Viewport) => {
  savedViewport.value = viewport
}, 300)

// 视口变化时保存位置
const onViewportChange = (viewport: Viewport) => {
  saveViewport(viewport)
}

const onInit = (instance: any) => {
  vueFlowInstance.value = instance
  // 初始化时恢复上次的视口位置
  if (savedViewport.value) {
    instance.setViewport(savedViewport.value)
  }
}

const fitView = (options?: any) => {
  vueFlowInstance.value?.fitView(options)
}

const isDrawing = ref(false)
const isSpacePressed = ref(false)

const panOnDrag = computed(() => isSpacePressed.value ? true : [1, 2])

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && !e.repeat) {
    isSpacePressed.value = true
  }
}
const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

onMounted(() => {
  // 加载便签数据
  loadNotes()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

const onWrapperDoubleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.classList.contains('vue-flow__pane')) return
  if (!vueFlowInstance.value) return
  
  const position = vueFlowInstance.value.screenToFlowCoordinate({ x: e.clientX, y: e.clientY })
  createNote(position.x - 200, position.y - 150, 400, 300)
}

const selectionRect = ref<{ x: number, y: number, w: number, h: number } | null>(null)
const dragStartScreen = ref<{ x: number, y: number } | null>(null)

const onWrapperMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.classList.contains('vue-flow__pane')) return

  if (isSpacePressed.value) return

  if (e.button === 0) {
    isDrawing.value = true
    
    dragStartScreen.value = { x: e.clientX, y: e.clientY }
    
    selectionRect.value = { x: e.clientX, y: e.clientY, w: 0, h: 0 }
  }
}

const onWrapperMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value || !dragStartScreen.value) return

  const currentX = e.clientX
  const currentY = e.clientY
  
  const startX = dragStartScreen.value.x
  const startY = dragStartScreen.value.y
  
  const width = Math.abs(currentX - startX)
  const height = Math.abs(currentY - startY)
  
  const left = currentX < startX ? currentX : startX
  const top = currentY < startY ? currentY : startY

  selectionRect.value = { x: left, y: top, w: width, h: height }
}

const onWrapperMouseUp = (e: MouseEvent) => {

  if (!vueFlowInstance.value) {
    isDrawing.value = false
    return
  }

  if (!isDrawing.value || !selectionRect.value) {
    isDrawing.value = false
    return
  }
  
  const finalW = selectionRect.value.w

  isDrawing.value = false
  selectionRect.value = null
  
  // 绘制宽度 >= 300px 才创建便签
  if (finalW >= 300) {
    const startScreen = dragStartScreen.value!
    const endScreen = { x: e.clientX, y: e.clientY }

    const startFlow = vueFlowInstance.value.screenToFlowCoordinate(startScreen)
    const endFlow = vueFlowInstance.value.screenToFlowCoordinate(endScreen)

    const x = Math.min(startFlow.x, endFlow.x)
    const y = Math.min(startFlow.y, endFlow.y)
    const w = Math.abs(startFlow.x - endFlow.x)
    const h = Math.abs(startFlow.y - endFlow.y)
    
    createNote(x, y, w, h)
  }

  dragStartScreen.value = null
}

const createNote = (x: number, y: number, w: number, h: number) => {
  if (!vueFlowInstance.value) return
  const id = Date.now().toString()
  const newNode: Node = {
    id,
    type: 'sticky',
    position: { x, y },
    data: { content: '<p></p>' },
    style: { width: `${w}px`, height: `${h}px` }
  }
  vueFlowInstance.value.addNodes([newNode])
}

</script>

<template>
  <div
    class="w-screen h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative transition-colors"
    :class="{ 'cursor-grab active:cursor-grabbing': isSpacePressed, 'cursor-crosshair': !isSpacePressed && !isDrawing }"
    @mousedown="onWrapperMouseDown"
    @mousemove="onWrapperMouseMove"
    @mouseup="onWrapperMouseUp"
    @dblclick="onWrapperDoubleClick"
  >
    <VueFlow
      v-model="nodes"
      :edges="edges"
      :min-zoom="0.1"
      :max-zoom="4"
      :default-viewport="savedViewport"
      :nodes-draggable="true"
      :nodes-connectable="false"
      :pan-on-drag="panOnDrag" 
      :pan-on-scroll="true"
      @init="onInit"
      @viewport-change="onViewportChange"
      :zoom-on-double-click="false"
      class="h-full w-full"
    >
      <Background :pattern-color="isDark ? '#333' : '#ddd'" :gap="24" />
            
      <Controls position="bottom-left" class="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800" />

      <template #node-sticky="props">
        <StickyNoteNode v-bind="props" />
      </template>

    </VueFlow>

    <div v-if="selectionRect"
         class="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-50 rounded-lg backdrop-blur-[1px]"
         :style="{
           left: `${selectionRect.x}px`,
           top: `${selectionRect.y}px`,
           width: `${selectionRect.w}px`,
           height: `${selectionRect.h}px`,
         }"
    ></div>
    
    <div class="fixed top-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 p-2 pl-4 pr-2 rounded-full shadow-lg flex items-center gap-3 z-50">
      <span class="text-xs font-medium text-zinc-500 select-none">
        Double-click or drag to create • Space to pan
      </span>
      <button 
        @click="fitView({ padding: 0.2, duration: 800 })"
        class="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        title="Reset View"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
    </div>

  </div>
</template>

<style>
.vue-flow__selection {
  display: none;
}
</style>
