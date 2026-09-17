<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  markdownEn: string;
  markdownId: string;
}>();

const language = ref<"en" | "id">("en");

const emit = defineEmits<{
  close: [];
}>();

interface TocItem {
  id: string;
  label: string;
  level: 1 | 2 | 3;
}

function slug(value: string, used: Set<string>) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || "section";
  let id = base;
  let count = 2;
  while (used.has(id)) id = `${base}-${count++}`;
  used.add(id);
  return id;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function inline(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((#[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderMarkdown(markdown: string) {
  const used = new Set<string>();
  const toc: TocItem[] = [];
  const html: string[] = [];
  let listOpen = false;
  let paragraph: string[] = [];
  let codeBlock: string[] | null = null;

  const closeList = () => {
    if (listOpen) html.push("</ul>");
    listOpen = false;
  };
  const closeParagraph = () => {
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    if (line.trim().startsWith("```")) {
      closeParagraph();
      closeList();
      if (codeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBlock.join("\n"))}</code></pre>`);
        codeBlock = null;
      } else {
        codeBlock = [];
      }
      continue;
    }
    if (codeBlock) {
      codeBlock.push(line);
      continue;
    }
    const heading = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      closeParagraph();
      closeList();
      const level = heading[1].length as 1 | 2 | 3 | 4;
      const label = heading[2];
      const id = slug(label, used);
      if (level <= 3) toc.push({ id, label, level: level as 1 | 2 | 3 });
      html.push(`<h${level} id="${id}">${inline(label)}</h${level}>`);
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      closeParagraph();
      if (!listOpen) html.push("<ul>"), (listOpen = true);
      html.push(`<li>${inline(line.replace(/^\s*-\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      closeParagraph();
      closeList();
      html.push(`<p class="step">${inline(line.replace(/^\s*\d+\.\s+/, ""))}</p>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeParagraph();
      closeList();
      html.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }
    if (!line.trim()) {
      closeParagraph();
      closeList();
      continue;
    }
    paragraph.push(line.trim());
  }
  if (codeBlock) html.push(`<pre><code>${escapeHtml(codeBlock.join("\n"))}</code></pre>`);
  closeParagraph();
  closeList();
  return { html: html.join("\n"), toc };
}

const document = computed(() => renderMarkdown(language.value === "en" ? props.markdownEn : props.markdownId));

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}

watch(() => props.open, (open) => {
  if (open) window.addEventListener("keydown", closeOnEscape);
  else window.removeEventListener("keydown", closeOnEscape);
});

onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));
</script>

<template>
  <Transition name="guide-fade">
    <div v-if="open" class="guide-shell" @click.self="emit('close')">
      <aside class="guide-drawer" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <header class="guide-header">
          <div>
            <span class="guide-kicker">Reference / working guide</span>
          <h2 id="guide-title">Guide</h2>
          </div>
          <div class="guide-actions">
            <div class="guide-language" aria-label="Guide language">
              <button type="button" :class="{ active: language === 'en' }" :aria-pressed="language === 'en'" @click="language = 'en'">EN</button>
              <button type="button" :class="{ active: language === 'id' }" :aria-pressed="language === 'id'" @click="language = 'id'">ID</button>
            </div>
            <button class="guide-close" type="button" aria-label="Close guide" @click="emit('close')"><span aria-hidden="true">×</span></button>
          </div>
        </header>
        <div class="guide-body">
          <nav class="guide-toc" aria-label="Table of contents">
            <span class="toc-label">In this guide</span>
            <div class="toc-links">
              <a v-for="item in document.toc" :key="item.id" :class="`toc-level-${item.level}`" :href="`#${item.id}`">{{ item.label }}</a>
            </div>
          </nav>
          <article class="guide-content" v-html="document.html"></article>
        </div>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.guide-shell {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgb(20 35 29 / 48%);
}

.guide-drawer {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(960px, 100vw);
  height: 100%;
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: -12px 0 30px rgb(20 35 29 / 18%);
}

.guide-body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 0;
}

.guide-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px 20px;
  background: var(--ink);
  color: #fff;
}

.guide-kicker,
.toc-label {
  display: block;
  color: #BFCABE;
  font: 11px/1.4 var(--font-mono);
  letter-spacing: .06em;
  text-transform: uppercase;
}

.guide-header h2 {
  margin-top: 8px;
  font-size: 24px;
  line-height: 1;
}

.guide-close {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #526057;
  border-radius: var(--radius-sm);
  background: #294037;
  color: #fff;
  font: 400 20px/1 var(--font-body);
  cursor: pointer;
}

.guide-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.guide-language {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid #526057;
  border-radius: var(--radius-sm);
  background: #1d3028;
}

.guide-language button {
  min-width: 32px;
  min-height: 28px;
  padding: 0 7px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: #BFCABE;
  font: 11px/1 var(--font-mono);
  cursor: pointer;
}

.guide-language button.active,
.guide-language button:hover,
.guide-language button:focus-visible {
  background: #3A6431;
  color: #fff;
}

.guide-close:hover {
  background: #3A6431;
}

.guide-close span {
  transform: translateY(-1px);
}

.guide-toc {
  min-height: 0;
  overflow-y: auto;
  padding: 16px 28px 18px;
  border-right: 1px solid var(--line);
  background: var(--paper);
}

.toc-links {
  display: grid;
  gap: 5px;
  margin-top: 10px;
}

.toc-links a {
  min-height: 28px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.35;
  text-decoration: none;
}

.toc-links a:hover,
.toc-links a:focus-visible {
  color: var(--cat-environment);
  text-decoration: underline;
}

.toc-level-1 {
  grid-column: 1 / -1;
  color: var(--ink) !important;
  font-weight: 600;
}

.toc-level-3 {
  padding-left: 12px;
  color: var(--ink-faint) !important;
  font-size: 12px !important;
}

.guide-content {
  overflow-y: auto;
  padding: 30px 40px 56px;
  scroll-behavior: smooth;
}

.guide-content :deep(h1),
.guide-content :deep(h2),
.guide-content :deep(h3),
.guide-content :deep(h4) {
  scroll-margin-top: 20px;
}

.guide-content :deep(h1) {
  margin-bottom: 14px;
  font-size: 27px;
  line-height: 1.15;
}

.guide-content :deep(h2) {
  margin: 34px 0 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 19px;
}

.guide-content :deep(h3) {
  margin: 22px 0 7px;
  font-size: 15px;
}

.guide-content :deep(h4) {
  margin: 18px 0 6px;
  color: var(--ink);
  font-size: 14px;
}

.guide-content :deep(p),
.guide-content :deep(li),
.guide-content :deep(blockquote) {
  max-width: none;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.65;
}

.guide-content :deep(p) {
  margin: 0 0 13px;
}

.guide-content :deep(pre) {
  overflow-x: auto;
  margin: 14px 0 18px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper);
  color: var(--ink);
  font: 12px/1.55 var(--font-mono);
}

.guide-content :deep(ul) {
  margin: 0 0 16px 20px;
}

.guide-content :deep(li) {
  padding-left: 4px;
}

.guide-content :deep(blockquote) {
  margin: 18px 0;
  padding: 10px 14px;
  border-left: 2px solid var(--cat-environment);
  background: var(--paper);
}

.guide-content :deep(code) {
  padding: 1px 4px;
  background: var(--paper-sunk);
  color: var(--ink);
  font: 12px/1.4 var(--font-mono);
}

.guide-content :deep(a) {
  color: var(--cat-hydrology);
  text-decoration: underline;
}

.guide-fade-enter-active,
.guide-fade-leave-active {
  transition: opacity .18s ease;
}

.guide-fade-enter-active .guide-drawer,
.guide-fade-leave-active .guide-drawer {
  transition: transform .22s ease;
}

.guide-fade-enter-from,
.guide-fade-leave-to {
  opacity: 0;
}

.guide-fade-enter-from .guide-drawer,
.guide-fade-leave-to .guide-drawer {
  transform: translateX(24px);
}

@media (max-width: 560px) {
  .guide-header,
  .guide-toc {
    padding-left: 20px;
    padding-right: 20px;
  }

  .guide-body {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .guide-toc {
    max-height: 38vh;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .guide-content {
    padding: 24px 20px 48px;
  }

  .toc-level-1 {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-fade-enter-active,
  .guide-fade-leave-active,
  .guide-fade-enter-active .guide-drawer,
  .guide-fade-leave-active .guide-drawer {
    transition: none;
  }

  .guide-content {
    scroll-behavior: auto;
  }
}
</style>
