<script lang="ts">
  import type { Difficulty, Characteristic } from "../shared/goodies";
  import Standard from "$lib/media/icons/standard.svg";
  import OneSaber from "$lib/media/icons/one-saber.svg";
  import NoArrows from "$lib/media/icons/no-arrows.svg";
  import Degree360 from "$lib/media/icons/360-degree.svg";
  import Degree90 from "$lib/media/icons/90-degree.svg";
  import Lightshow from "$lib/media/icons/lightshow.svg";
  import Lawless from "$lib/media/icons/lawless.svg";

  let props: {
    difficulty: Difficulty;
    characteristic: Characteristic;
    size: `sm` | `lg`;
  } = $props();

  let sizeClass = $derived.by(() => {
    switch (props.size) {
      case "sm":
        return {div: "w-6 h-6", img: "w-4 h-4 m-auto"};
      case "lg":
        return {div: "w-8 h-8", img: "w-6 h-6 m-auto"};
    }
  });

  let color = $derived.by(() => {
    switch (props.difficulty) {
      case "Easy":
        return "008055";
      case "Normal":
        return "1268a1";
      case "Hard":
        return "bd5500";
      case "Expert":
        return "b52a1c";
      case "ExpertPlus":
        return "7646af";
    }
  });

  let characteristicIcon = $derived.by(() => {
    switch (props.characteristic) {
      case "Standard":
        return Standard;
      case "OneSaber":
        return OneSaber;
      case "NoArrows":
        return NoArrows;
      case "360Degree":
        return Degree360;
      case "90Degree":
        return Degree90;
      case "Lightshow":
        return Lightshow;
      case "Lawless":
        return Lawless;
    }
  });
</script>

<div class="flex {sizeClass.div} rounded-full" style="background-color: #{color};">
  <img src="{characteristicIcon}" alt="{props.characteristic}" class="{sizeClass.img}" title="{props.characteristic} {props.difficulty}" />
</div>