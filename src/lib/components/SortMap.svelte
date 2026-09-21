<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { Submission } from "../server/database";
  import type { BSMap } from "../shared/beatsaverTypes";
  import MapBase from "./MapBase.svelte";

  let props: {
    submission: InferAttributes<Submission>;
    bsAPI: BSMap
  } = $props();
</script>

<MapBase map={props.bsAPI} characteristic={props.submission.characteristic} difficulty={props.submission.difficulty} />