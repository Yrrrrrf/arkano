<script lang="ts">
interface Props {
	initial?: number;
	count?: number;
	onchange?: (count: number) => void;
}

let { initial = 0, count = $bindable(initial), onchange }: Props = $props();

let time = $state(new Date());
let timeString = $derived(time.toLocaleTimeString());

$effect(() => {
	const timer = setInterval(() => {
		time = new Date();
	}, 1000);
	return () => clearInterval(timer);
});
</script>

<div class="card bg-base-200 shadow-md p-6 flex flex-col items-center gap-4">
	<div class="badge badge-neutral font-mono text-xs tracking-wider">
		{timeString}
	</div>
	<span class="text-4xl font-mono font-bold">{count}</span>
	<div class="flex gap-2">
		<button
			type="button"
			class="btn btn-primary btn-sm"
			onclick={() => {
				count += 1;
				onchange?.(count);
			}}
		>
			Increment
		</button>
		<button
			type="button"
			class="btn btn-ghost btn-sm"
			onclick={() => {
				count = 0;
				onchange?.(count);
			}}
		>
			Reset
		</button>
	</div>
</div>
