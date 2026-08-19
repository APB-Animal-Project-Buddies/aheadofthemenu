FoodLP database export
======================

Row counts:
  food_nutrients           21700 rows
  foods                    8092 rows
  serving_sizes            0 rows
  shopping_list_items      8 rows
  vegan_classifications    3225 rows

FK links: food_nutrients.food_id -> foods.id ; serving_sizes.food_id -> foods.id
Load: create tables from schema.sql, then bulk-import each <table>.csv (header = columns).

source-list/usda-foodlist-ranked.json : the authoritative 8092-food source list that
  populated the foods shells (fields: fdcId, name, dataType, category, tier, rank).
  Matches the foods table 1:1 (all 8092 fdc_ids and names). tier/rank = computed
  research-priority (note: the running slices actually iterate by id, not by this rank).

flowcharts/ : the FlowCoder pipelines used to fill the DB (seed-research = current per-food
  nutrition research; seed-bulk-import = earlier bulk load; cost-backfill = cost columns).
  They read the USDA key from the DB at runtime; no key value embedded.

EXCLUDED: settings table (held the USDA API key) -> bundle is key-free.

CAVEAT: mid-rebuild snapshot -- only 364 of 8092 foods have researched nutrition;
the rest are shells. serving_sizes/costs/brands/vegan tags mostly unpopulated.
