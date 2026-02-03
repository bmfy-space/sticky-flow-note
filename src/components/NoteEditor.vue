<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps<{
  modelValue: string
  autoFocus?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue,
  autofocus: props.autoFocus ? 'end' : false,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
  ],
  onCreate({ editor }) {
    if (props.autoFocus) {
      // 给一点延迟，确保 Vue Flow 已经完全将节点渲染到 DOM 树中
      setTimeout(() => {
        editor.commands.focus('end')
      }, 100)
    }
  },
  editorProps: {
    attributes: {
      class: 'prose-sm focus:outline-none h-full text-zinc-800 dark:text-zinc-200 leading-relaxed',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// 暴露 focus 方法供父组件调用
const focus = () => {
  editor.value?.commands.focus()
}

defineExpose({ focus })
</script>

<template>
  <editor-content :editor="editor" class="h-full w-full" />
</template>

<style>
/* Basic Tiptap overrides if needed */
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Minimal typography for lists */
.ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.5em;
}
.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.5em;
}
.ProseMirror h1 {
  font-size: 1.5em;
  font-weight: 700;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
}
.ProseMirror h2 {
  font-size: 1.25em;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
}
.ProseMirror blockquote {
  border-left: 3px solid #e5e7eb;
  padding-left: 1rem;
  color: #6b7280;
}
</style>
