<script lang="ts">
let { label = "Bridge" }: { label?: string } = $props();
</script>
<button>{label}</button>
<style>
  button { color: rgb(220, 20, 60); }
</style>
