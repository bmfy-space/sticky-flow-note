<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { ref, watch } from 'vue'
import { useDateFormat, useNow } from '@vueuse/core'
import { Trash2 } from 'lucide-vue-next'
import NoteEditor from './NoteEditor.vue'

const props = defineProps<{
  id: string
  data: { 
    content: string 
    date?: number
  }
  selected?: boolean
}>()

const { removeNodes } = useVueFlow() 

// Internal state for the editor content to sync with node data
const content = ref(props.data.content)
const now = useNow()
const formattedDate = useDateFormat(props.data.date || now, 'MMM D, HH:mm')

// Watch for content changes to update node data (for persistence in parent)
watch(content, (newVal) => {
  props.data.content = newVal
})

const deleteNote = () => {
  removeNodes(props.id)
}
</script>

<template>
  <div class="h-full w-full flex flex-col rounded-xl shadow-xl overflow-hidden border transition-all duration-200"
    :class="[
      selected ? 'shadow-2xl z-10' : '',
      'bg-yellow-100 dark:bg-zinc-900 border-yellow-200 dark:border-zinc-800'
    ]"
  >
    <NodeResizer 
      :min-width="60" 
      :min-height="60" 
      :is-visible="selected" 
      line-class-name="!bg-transparent" 
      handle-class-name="!bg-transparent"
    />

    <!-- Header / Drag Handle -->
    <!-- 'custom-drag-handle' class is used by VueFlow to restrict dragging to this area if configured, 
         but by default VueFlow drags the whole node. We'll let whole node drag for now unless text is selected. -->
    <div class="h-8 shrink-0 bg-yellow-200/50 dark:bg-zinc-800/80 backdrop-blur-sm border-b border-yellow-200/50 dark:border-zinc-800 flex items-center justify-between px-2 cursor-move select-none header-handle">
      <div class="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
         <!-- Fake traffic lights -->
         <div class="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
         <div class="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
         <div class="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
      </div>
      
      <div class="text-[10px] text-yellow-800 dark:text-zinc-500 font-mono">
        {{ formattedDate }}
      </div>

      <button @click.stop="deleteNote" class="text-black/20 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Content -->
    <!-- 'nodrag' class allows interaction with text editor without moving the node -->
    <div class="flex-1 overflow-hidden relative nowheel nodrag cursor-text">
      <NoteEditor v-model="content" class="h-full w-full outline-none" />
    </div>

    <!-- We can add handles if we want connections later -->
    <!-- <Handle type="source" :position="Position.Bottom" /> -->
  </div>
</template>

<style>
/* Ensure Tiptap takes full height and handles overflow inside the node */
.ProseMirror {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
  outline: none;
}
/* Custom Scrollbar for the note content */
.ProseMirror::-webkit-scrollbar {
  width: 6px;
}
.ProseMirror::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.1);
  border-radius: 3px;
}

/* Force hide Vue Flow Resizer visuals but keep them clickable */
.vue-flow__resize-control {
  background: transparent !important;
  border: none !important;
}
.vue-flow__resize-control.line {
  border-color: transparent !important;
}
.vue-flow__resize-control.handle {
  background-color: transparent !important;
  border: none !important;
}
</style>
