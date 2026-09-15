<script setup lang="ts">
</script>

<template>
  <div class="legend-float">
    <div class="row"><span class="sw" style="background:#B4652A"></span>Mining permit (IUP)</div>
    <div class="row"><span class="sw" style="background:#C1432B"></span>Surface disturbance</div>
    <div class="row"><span class="sw" style="background:#46743A"></span>Vegetation (NDVI)</div>
    <div class="row"><span class="sw" style="background:#3FA0AA"></span>River / watershed</div>
  </div>
</template>

<style scoped>
.legend-float {
  background: rgba(247, 248, 241, .95);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px 13px;
  font-size: 11.5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
}

.row {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-soft);
}

.sw {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  flex: none;
}
</style>
