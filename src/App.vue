<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow, type Node, type XYPosition } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useStorage, usePreferredDark } from '@vueuse/core'
import { RotateCcw } from 'lucide-vue-next'
import StickyNoteNode from './components/StickyNoteNode.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/node-resizer/dist/style.css'

// --- State ---
// Persist nodes in local storage
const nodes = useStorage<Node[]>('sticky-notes-data', [
  { 
    id: '1', 
    type: 'sticky', 
    position: { x: 100, y: 100 }, 
    data: { content: '<h1>Welcome!</h1><p>Double click anywhere or drag to create a note.</p>' },
    style: { width: '300px', height: '250px' }, // Initial size
  }
], localStorage, { deep: true })

const isDark = usePreferredDark()

// We don't really need edges for now, but valid prop
const edges = ref([])

// --- Interactions ---
const { addNodes, screenToFlowCoordinate, fitView } = useVueFlow()

const isDrawing = ref(false)
const isSpacePressed = ref(false)

// Dynamic Pan On Drag: If true (boolean), it allows left click pan. 
// We want: Right/Middle (buttons 1,2) always pan. Left (button 0) only pans if Space is held.
// Vue Flow `panOnDrag` can be a boolean or an array of button codes.
// Unfortunately it's not reactive to a function easily for "Left Button ONLY when space".
// So we switch the prop value based on Space key.
// [1, 2] = Middle, Right. true = All.
// logic: if space pressed, value is true (all buttons). if not, value is [1, 2].
const panOnDrag = computed(() => isSpacePressed.value ? true : [1, 2])

// Key Listeners
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
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

// Double Click to create default note
const onPaneDoubleClick = (event: MouseEvent) => {
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  createNote(position.x - 150, position.y - 100, 300, 200) // Center approx
}

// --- Draw to Create Logic ---
const wrapperRef = ref<HTMLElement | null>(null)
// Visual preview in SCREEN coordinates
const selectionRect = ref<{ x: number, y: number, w: number, h: number } | null>(null)
// Start point in FLOW coordinates (for final creation)
const dragStartFlow = ref<XYPosition | null>(null)
// Start point in SCREEN coordinates (for calculating width/height)
const dragStartScreen = ref<{ x: number, y: number } | null>(null)

const onWrapperMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  // Check if we are clicking on the background pane
  if (!target.classList.contains('vue-flow__pane')) return

  // Prevent drawing if Space is held (Panning mode)
  if (isSpacePressed.value) return

  // Left Click (0) -> Draw
  if (e.button === 0) { 
    isDrawing.value = true
    
    // Record starting positions
    dragStartScreen.value = { x: e.clientX, y: e.clientY }
    const flowPos = screenToFlowCoordinate({ x: e.clientX, y: e.clientY })
    dragStartFlow.value = flowPos
    
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
  if (!isDrawing.value || !dragStartFlow.value || !selectionRect.value) {
    isDrawing.value = false
    return
  }
  
  // Finish drawing
  const finalW = selectionRect.value.w
  const finalH = selectionRect.value.h

  // Reset
  isDrawing.value = false
  selectionRect.value = null
  
  // Only create if it's a drag (threshold 30px), otherwise clear/ignore
  if (finalW > 30 && finalH > 30) {
    // Correct approach: Convert both Start and End points to Flow Coordinates
    // This handles zoom and pan automatically and precisely.
    const startScreen = dragStartScreen.value!
    const endScreen = { x: e.clientX, y: e.clientY }

    const startFlow = screenToFlowCoordinate(startScreen)
    const endFlow = screenToFlowCoordinate(endScreen)

    // Calculate bounds in Flow Space
    const x = Math.min(startFlow.x, endFlow.x)
    const y = Math.min(startFlow.y, endFlow.y)
    const w = Math.abs(startFlow.x - endFlow.x)
    const h = Math.abs(startFlow.y - endFlow.y)
    
    createNote(x, y, w, h)
  }
  
  dragStartFlow.value = null
  dragStartScreen.value = null
}

const createNote = (x: number, y: number, w: number, h: number) => {
  const id = Date.now().toString()
  const newNode: Node = {
    id,
    type: 'sticky',
    position: { x, y },
    data: { content: '<p></p>' },
    style: { width: `${w}px`, height: `${h}px` }
  }
  addNodes([newNode])
}

</script>

<template>
  <div 
    ref="wrapperRef" 
    class="w-screen h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative transition-colors"
    :class="{ 'cursor-grab active:cursor-grabbing': isSpacePressed, 'cursor-crosshair': !isSpacePressed && !isDrawing }"
    @mousedown="onWrapperMouseDown"
    @mousemove="onWrapperMouseMove"
    @mouseup="onWrapperMouseUp"
  >
    <VueFlow
      v-model="nodes"
      :edges="edges"
      :min-zoom="0.1"
      :max-zoom="4"
      :default-viewport="{ zoom: 1 }"
      :nodes-draggable="true"
      :nodes-connectable="false"
      :pan-on-drag="panOnDrag" 
      :pan-on-scroll="true"
      @pane-dbl-click="onPaneDoubleClick"
      class="h-full w-full"
    >
      <!-- Background pattern -->
      <Background :pattern-color="isDark ? '#333' : '#ddd'" gap="24" />
      
      <!-- Controls (Bottom Left) -->
      <Controls position="bottom-left" class="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800" />

      <!-- Custom Node Type -->
      <template #node-sticky="props">
        <StickyNoteNode v-bind="props" />
      </template>

      <!-- Draw Preview Overlay (Screen Space) -->
    </VueFlow>

    <!-- Selection / Draw Rect (Outside VueFlow to force Screen Space) -->
    <div v-if="selectionRect" 
         class="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-50 rounded-lg backdrop-blur-[1px]"
         :style="{
           left: `${selectionRect.x}px`,
           top: `${selectionRect.y}px`,
           width: `${selectionRect.w}px`,
           height: `${selectionRect.h}px`,
         }"
    ></div>
    
    <!-- Top Bar Overlay -->
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
/* Disable default selection rect if we are implementing custom drag */
.vue-flow__selection {
  display: none;
}
</style>
