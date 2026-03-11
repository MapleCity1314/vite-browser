<script setup lang="ts">
import { computed, ref } from "vue";
import { useData } from "vitepress";

const rawMarkdownPages = import.meta.glob("../../../**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const { page } = useData();
const copied = ref(false);

const isChinese = computed(() => page.value.relativePath.startsWith("zh/"));

const labels = computed(() => ({
  button: isChinese.value ? "复制为 Markdown" : "Copy as Markdown",
  copied: isChinese.value ? "已复制" : "Copied",
  missing: isChinese.value ? "未找到 Markdown 源文件" : "Markdown source unavailable",
}));

const markdownSource = computed(() => {
  const directKey = `../../../${page.value.relativePath}`;
  return (
    rawMarkdownPages[directKey] ??
    Object.entries(rawMarkdownPages).find(([key]) =>
      key.endsWith(page.value.relativePath),
    )?.[1] ??
    ""
  );
});

async function copyMarkdown() {
  if (!markdownSource.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(markdownSource.value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = markdownSource.value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1400);
}
</script>

<template>
  <div v-if="page.relativePath" class="vb-copy-float">
    <button
      class="vb-copy-button"
      type="button"
      :aria-label="labels.button"
      @click="copyMarkdown"
    >
      {{ copied ? labels.copied : labels.button }}
    </button>
    <span v-if="!markdownSource" class="vb-copy-note">
      {{ labels.missing }}
    </span>
  </div>
</template>
