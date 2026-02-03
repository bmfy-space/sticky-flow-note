<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
// StarterKit includes essentials.

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose-sm focus:outline-none h-full text-zinc-800 dark:text-zinc-200 leading-relaxed',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Watch for external changes if needed, but for local note usually not.
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
