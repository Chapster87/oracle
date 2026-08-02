import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { parseMarkdown } from "./parser";
import { EntityRegistry } from "./registry";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const ADMIN_ID = "4ce7ae1c-9681-4686-8019-5228d6e35ce7";

function getFiles(branch: string | null) {
  const sourcePath = "c:/Repos/oracle/Campaign";
  if (!branch) {
    const files: any[] = [];
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) walk(filePath);
        else if (file.endsWith(".md")) {
          files.push({
            path: path.relative(sourcePath, filePath).replace(/\\/g, "/"),
            content: fs.readFileSync(filePath, "utf-8"),
          });
        }
      });
    };
    walk(sourcePath);
    return files;
  }
  const output = execSync(`git ls-tree -r ${branch}:Campaign`, {
    cwd: "c:/Repos/oracle",
  }).toString();
  return output
    .trim()
    .split("\n")
    .filter((l) => l.includes(".md"))
    .map((l) => {
      // git ls-tree output format: <mode> <type> <object>    <file>
      // We need to handle filenames with spaces correctly.
      const match = l.match(/^\d+\s+\w+\s+[a-f0-9]+\s+(.+)$/);
      if (!match) return null;
      const filePath = match[1];
      try {
        return {
          path: filePath,
          content: execSync(`git show ${branch}:"Campaign/${filePath}"`, {
            cwd: "c:/Repos/oracle",
            stdio: ["pipe", "pipe", "ignore"],
          }).toString(),
        };
      } catch (e) {
        console.warn(`Warning: Could not show ${filePath} on branch ${branch}`);
        return null;
      }
    })
    .filter((f): f is { path: string; content: string } => f !== null);
}

async function migrate() {
  console.log("Purging existing data...");
  const tables = [
    "entity_relations",
    "characters",
    "players",
    "locations",
    "factions",
    "items",
    "religions",
    "puzzles",
    "quest_hooks",
    "world_lore",
    "campaign_logs",
    "entities",
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.warn(`Warning: Could not purge table ${table}:`, error.message);
    } else {
      console.log(`  - Purged ${table}`);
    }
  }

  const registry = new EntityRegistry();

  // Check for existing campaign first or use a safer approach if unique constraint is missing
  let { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("name", "Campaign Zero")
    .single();

  if (campaignError && campaignError.code !== "PGRST116") {
    console.error("Error fetching campaign:", campaignError);
    return;
  }

  if (!campaign) {
    const { data: newCampaign, error: insertError } = await supabase
      .from("campaigns")
      .insert({ name: "Campaign Zero", owner_id: ADMIN_ID })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting campaign:", insertError);
      return;
    }
    campaign = newCampaign;
  }

  const phases = [
    { name: null, id: null },
    { name: "campaigns/zero", id: campaign.id },
  ];

  const processedEntities = new Set<string>();

  for (const phase of phases) {
    const files = getFiles(phase.name);
    for (const file of files) {
      const parsed = parseMarkdown(file.content);
      const fileName = path.basename(file.path, ".md");
      const pathParts = file.path.split("/");
      const topDir = pathParts[0].toLowerCase();
      if (["planning", "_episodes"].includes(topDir)) continue;

      let type = topDir.replace(/s$/, "").replace("quest hooks", "quest_hook");
      if (fileName.toLowerCase() === "world") type = "world_lore";
      if (fileName.toLowerCase() === "_storylog") {
        type = "campaign_log";
        parsed.name = "Story Log";
      }

      // World Lore and Campaign Logs are global
      if (["world_lore", "campaign_log"].includes(type) && phase.id !== null) {
        continue;
      }

      // Check if it's a Player Character in the Players directory
      if (topDir === "players" && !fileName.startsWith("_")) {
        type = "player";
      }

      if (fileName.startsWith("_") && fileName.toLowerCase() !== "_storylog")
        continue;

      // Avoid duplicates if the same file/entity exists in multiple phases
      const entityKey = `${parsed.name.toLowerCase()}-${phase.id}`;
      if (processedEntities.has(entityKey)) {
        console.log(
          `  -> Skipping duplicate entity: ${parsed.name} (${phase.name || "Global"})`,
        );
        continue;
      }
      processedEntities.add(entityKey);

      const effectiveCampaignId = ["world_lore", "campaign_log"].includes(type)
        ? null
        : phase.id;

      const { data: entity } = await supabase
        .from("entities")
        .upsert(
          {
            name: parsed.name,
            type,
            content: parsed.content,
            campaign_id: effectiveCampaignId,
            owner_id: ADMIN_ID,
            metadata: { tags: parsed.tags },
          },
          { onConflict: "name, campaign_id" },
        )
        .select()
        .single();

      if (entity) {
        registry.register(parsed.name, fileName, entity.id);
        const base = {
          id: entity.id,
          name: parsed.name,
          campaign_id: effectiveCampaignId,
          owner_id: ADMIN_ID,
          tags: parsed.tags,
        };
        console.log(`  -> Specializing ${type}: ${parsed.name}`);
        let specializedError;

        const { tags, ...baseWithoutTags } = base;

        if (type === "character") {
          const { error } = await supabase.from("characters").upsert({
            ...base,
            species: parsed.species,
            class: parsed.class,
            alignment:
              parsed.alignment ||
              (parsed.class?.includes("Neutral") ||
              parsed.class?.includes("Evil") ||
              parsed.class?.includes("Good")
                ? parsed.class
                : null),
            appearance: parsed.appearance,
            personality: parsed.personality,
            role: parsed.role_in_campaign,
            secrets: parsed.secrets,
          });
          specializedError = error;
        } else if (type === "player") {
          const { error } = await supabase.from("players").upsert({
            ...baseWithoutTags,
            species: parsed.species,
            class_es: parsed.class_es,
            alignment: parsed.alignment,
            level: parsed.level,
            background: parsed.background,
            backstory: parsed.backstory,
          });
          specializedError = error;
        } else if (type === "location") {
          const { error } = await supabase.from("locations").upsert({
            ...base,
            type: parsed.type,
            overview: parsed.overview,
            history: parsed.history,
            inhabitants: parsed.inhabitants,
          });
          specializedError = error;
        } else if (type === "faction") {
          const { error } = await supabase.from("factions").upsert({
            ...base,
            alignment: parsed.alignment,
            overview: parsed.overview,
            goals: parsed.goals,
            beliefs: parsed.beliefs,
          });
          specializedError = error;
        } else if (type === "item") {
          const { error } = await supabase.from("items").upsert({
            ...base,
            type: parsed.type,
            rarity: parsed.rarity,
            description: parsed.description,
            history: parsed.history,
            role_in_campaign: parsed.role_in_campaign,
          });
          specializedError = error;
        } else if (type === "religion") {
          const { error } = await supabase.from("religions").upsert({
            ...base,
            type: parsed.type,
            overview: parsed.overview,
            domains_teachings: parsed.domains_teachings,
            worship_rituals: parsed.worship_rituals,
            clergy_followers: parsed.clergy_followers,
            history_myths: parsed.history_myths,
            role_in_campaign: parsed.role_in_campaign,
          });
          specializedError = error;
        } else if (type === "puzzle") {
          const { error } = await supabase.from("puzzles").upsert({
            ...base,
            status: parsed.status,
            type: parsed.type,
            overview: parsed.overview,
            puzzle_details: parsed.the_puzzle,
            solution: parsed.the_solution,
            failure: parsed.failure,
          });
          specializedError = error;
        } else if (type === "quest_hook") {
          const { error } = await supabase.from("quest_hooks").upsert({
            ...base,
            status: parsed.status,
            description: parsed.description,
            suggested_encounters: parsed.encounters_json,
          });
          specializedError = error;
        } else if (type === "world_lore") {
          const { error } = await supabase.from("world_lore").upsert({
            ...baseWithoutTags,
            content: parsed.content,
          });
          specializedError = error;
        } else if (type === "campaign_log") {
          // Remove tags for campaign_log as they don't exist in the schema
          const { tags, ...baseWithoutTags } = base;
          const { error } = await supabase.from("campaign_logs").upsert({
            ...baseWithoutTags,
            content: parsed.content,
          });
          specializedError = error;
        }

        if (specializedError) {
          console.error(
            `  [Specialized Error] ${type} ${parsed.name}:`,
            specializedError,
          );
        }
      }
    }
  }

  console.log("Processing relations...");
  let count = 0;
  for (const phase of phases) {
    for (const file of getFiles(phase.name)) {
      const parsed = parseMarkdown(file.content);
      const sourceId = registry.getById(parsed.name);
      if (!sourceId) continue;
      for (const link of parsed.links) {
        const targetId = registry.resolve(link);
        if (targetId) {
          // Check for existing relation first to handle missing constraint gracefully if needed
          const { data: existing } = await supabase
            .from("entity_relations")
            .select("id")
            .eq("source_id", sourceId)
            .eq("target_id", targetId)
            .eq("relation_type", "associated_with")
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase.from("entity_relations").insert({
              source_id: sourceId,
              target_id: targetId,
              relation_type: "associated_with",
            });
            if (error) {
              console.error(
                `Error linking ${parsed.name} to ${link.name}:`,
                error,
              );
            } else {
              count++;
            }
          } else {
            count++; // Already exists
          }
        }
      }
    }
  }
  console.log(`Finished. ${count} relations created.`);
}

migrate();
