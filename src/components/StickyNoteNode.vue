<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { ref, watch, computed } from 'vue'
import { useDateFormat } from '@vueuse/core'
import NoteEditor from './NoteEditor.vue'
import { Minus, X, Maximize2 } from 'lucide-vue-next'

const props = defineProps<{
  id: string
  data: { 
    content: string 
    updatedAt?: number
  }
  selected?: boolean
}>()

const { removeNodes } = useVueFlow() 

const content = ref(props.data.content)

// 使用 updatedAt 时间戳，如果不存在则使用当前时间作为初始值
const updatedAt = ref(props.data.updatedAt || Date.now())
const formattedDate = computed(() => useDateFormat(updatedAt.value, 'YYYY/MM/DD HH:mm:ss').value)

// 监听内容变化以更新节点数据（用于持久化）
watch(content, (newVal) => {
  props.data.content = newVal
  // 更新时间戳
  updatedAt.value = Date.now()
  props.data.updatedAt = updatedAt.value
})

// 删除便签
const handleRed = () => {
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
      :min-width="200" 
      :min-height="100" 
      :is-visible="selected" 
      line-class-name="!bg-transparent" 
      handle-class-name="!bg-transparent"
    />

    <!-- Header / Drag Handle -->
    <div class="h-8 shrink-0 bg-yellow-200/50 dark:bg-zinc-800/80 backdrop-blur-sm border-b border-yellow-200/50 dark:border-zinc-800 flex items-center justify-between px-2 cursor-move select-none header-handle group">
      
      <!-- Traffic Lights -->
      <div class="flex gap-1.5 opacity-100 transition-opacity">
         <!-- Red: Delete -->
         <div @click.stop="handleRed" class="w-3 h-3 rounded-full bg-[#ff5f56] border-[0.5px] border-[#e0443e] flex items-center justify-center cursor-pointer active:brightness-90">
             <X class="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
         <!-- Yellow: Minimize (已禁用) -->
         <div class="w-3 h-3 rounded-full bg-[#ffbd2e] border-[0.5px] border-[#dea123] flex items-center justify-center">
             <Minus class="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
         <!-- Green: Maximize (已禁用) -->
         <div class="w-3 h-3 rounded-full bg-[#27c93f] border-[0.5px] border-[#1aab29] flex items-center justify-center">
             <Maximize2 class="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
      </div>
      
      <div class="text-[10px] text-yellow-800 dark:text-zinc-500 font-mono">
        {{ formattedDate }}
      </div>
    
      <!-- Spacer to balance header -->
      <div class="w-8"></div> 
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden relative nowheel nodrag cursor-text">
      <NoteEditor v-model="content" class="h-full w-full outline-none" />
    </div>

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
