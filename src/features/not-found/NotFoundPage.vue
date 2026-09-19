<template>
  <main class="not-found" aria-labelledby="not-found-title">
    <div class="not-found__frame">
      <div class="not-found__eyebrow">
        <span class="not-found__marker" aria-hidden="true"></span>
        <span class="mono">HTTP 404 · outside the mapped area</span>
      </div>

      <div class="not-found__grid">
        <div class="not-found__copy">
          <p class="not-found__code mono">404</p>
          <h1 id="not-found-title">This path is not on the map.</h1>
          <p class="not-found__body">
            The page you requested does not exist in Taliabu Environmental Monitor. Return to the map to continue exploring the available evidence.
          </p>
          <a class="not-found__action" href="/">Return to map</a>
        </div>

        <div class="not-found__diagram" aria-hidden="true">
          <span class="not-found__contour contour-one"></span>
          <span class="not-found__contour contour-two"></span>
          <span class="not-found__contour contour-three"></span>
          <span class="not-found__crosshair"></span>
          <span class="not-found__coordinate mono">124.42°E · 02.10°S</span>
        </div>
      </div>

      <p class="not-found__path mono">requested path: {{ path }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
const path = window.location.pathname;
</script>

<style>
@import "@/shared/styles/variables.css";

.not-found {
  min-height: 100%;
  overflow: auto;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
}

.not-found__frame {
  display: flex;
  min-height: 100dvh;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(24px, 6vw, 72px);
  flex-direction: column;
  justify-content: space-between;
}

.not-found__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-faint);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.not-found__marker {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-alert);
}

.not-found__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.8fr);
  align-items: center;
  gap: clamp(32px, 8vw, 104px);
  margin: auto 0;
  padding: 12vh 0;
}

.not-found__code {
  margin-bottom: 12px;
  color: var(--cat-environment);
  font-size: clamp(1rem, 2vw, 1.25rem);
}

.not-found h1 {
  max-width: 11ch;
  font-size: clamp(2.4rem, 7vw, 5.5rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.not-found__body {
  max-width: 48ch;
  margin-top: 24px;
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.6;
}

.not-found__action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  margin-top: 32px;
  padding: 0 18px;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: var(--paper-raised);
  font-weight: 600;
  text-decoration: none;
}

.not-found__action:hover {
  background: var(--cat-environment);
}

.not-found__diagram {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  background: var(--paper-raised);
}

.not-found__diagram::before,
.not-found__diagram::after {
  position: absolute;
  content: "";
  background: var(--line);
}

.not-found__diagram::before {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

.not-found__diagram::after {
  top: 50%;
  right: 0;
  left: 0;
  height: 1px;
}

.not-found__contour {
  position: absolute;
  display: block;
  border: 1px solid var(--cat-environment);
  border-radius: 48% 52% 44% 56%;
  opacity: 0.65;
  transform: rotate(-19deg);
}

.contour-one {
  top: 22%;
  left: 16%;
  width: 68%;
  height: 42%;
}

.contour-two {
  top: 29%;
  left: 27%;
  width: 46%;
  height: 28%;
  border-color: var(--cat-hydrology);
}

.contour-three {
  top: 36%;
  left: 37%;
  width: 26%;
  height: 14%;
  border-color: var(--cat-coastal);
}

.not-found__crosshair {
  position: absolute;
  top: calc(50% - 7px);
  left: calc(50% - 7px);
  width: 14px;
  height: 14px;
  border: 2px solid var(--accent-alert);
  border-radius: 50%;
  background: var(--paper-raised);
}

.not-found__coordinate {
  position: absolute;
  right: 16px;
  bottom: 14px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.not-found__path {
  max-width: 100%;
  overflow: hidden;
  color: var(--ink-faint);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .not-found__frame {
    min-height: 100dvh;
    padding: 24px;
  }

  .not-found__grid {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 64px 0;
  }

  .not-found__diagram {
    min-height: 220px;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .not-found__crosshair {
    animation: not-found-pulse 2.8s ease-in-out infinite;
  }
}

@keyframes not-found-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(193 67 43 / 0%); }
  50% { box-shadow: 0 0 0 8px rgb(193 67 43 / 12%); }
}
</style>
