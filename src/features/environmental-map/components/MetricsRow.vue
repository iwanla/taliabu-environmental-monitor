<script setup lang="ts">
</script>

<template>
  <div class="metrics">
    <div class="trend-card">
      <h5>Vegetation trend</h5>
      <svg viewBox="0 0 200 46" preserveAspectRatio="none">
        <polyline points="0,10 30,14 60,12 90,22 120,26 150,34 180,30 200,36"
                  fill="none" stroke="#46743A" stroke-width="2"/>
      </svg>
      <div class="foot"><span>Jan</span><span>Sep</span></div>
    </div>

    <div class="alert">
      <span class="mark"></span>
      <div>
        <h5>Vegetation loss near Sungai Sibela</h5>
        <p>1.8 ha change between two observations, 210 m from the nearest river. Outside known permit boundary.</p>
        <div class="meta">sentinel-2-l2a · acquired 2026-09-09 · quality: medium</div>
      </div>
    </div>

    <div class="alert">
      <span class="mark" style="background:#B98A22;"></span>
      <div>
        <h5>Coastal sediment anomaly, north bay</h5>
        <p>Turbidity proxy elevated relative to 30-day baseline. No downstream mining activity confirmed.</p>
        <div class="meta">sentinel-2-l2a · acquired 2026-09-06 · quality: low</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics {
  grid-area: metrics;
  background: var(--paper);
  border-top: 1px solid var(--line);
  padding: 14px 20px 18px;
  display: grid;
  grid-template-columns: 220px 1fr 1fr;
  gap: 16px;
}

.trend-card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}

.trend-card h5 {
  font-size: 12.5px;
  margin-bottom: 8px;
}

.trend-card svg {
  width: 100%;
  height: 46px;
  display: block;
}

.trend-card .foot {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faint);
  margin-top: 4px;
}

.alert {
  display: flex;
  gap: 10px;
  border: 1px solid var(--line);
  background: var(--paper-raised);
  border-radius: var(--radius-md);
  padding: 11px 13px;
}

.alert .mark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-alert);
  margin-top: 5px;
  flex: none;
}

.alert h5 {
  font-size: 12.5px;
  margin-bottom: 2px;
}

.alert p {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-soft);
}

.alert .meta {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: #8A5140;
  margin-top: 5px;
}
</style>
