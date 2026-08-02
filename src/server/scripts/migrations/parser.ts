import path from "path";

/**
 * Normalizes names for robust lookups (lowercase, trim, spaces instead of underscores)
 */
export function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/[_-]/g, " ");
}

export function parseMarkdown(content: string) {
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : "Unknown";

  const result: Record<string, any> = {
    name,
    tags: [],
    content: content.trim(),
    links: [],
  };

  // Extract common metadata patterns
  const raceClassMatch = content.match(
    /-\s+\*\*Race, Class, & Alignment:\*\*\s+(.+)/,
  );
  if (raceClassMatch) {
    const parts = raceClassMatch[1].split(",").map((s) => s.trim());
    if (parts.length >= 1) result.species = parts[0];
    if (parts.length >= 2) result.class = parts[1];
    if (parts.length >= 3) result.alignment = parts[2];
  }

  // Species, Class(es), Alignment, Level for Players
  const speciesMatch = content.match(/-\s+\*\*Species:\*\*\s*(.*)/);
  if (speciesMatch) result.species = speciesMatch[1].trim();

  const classesMatch = content.match(/-\s+\*\*Class\(es\):\*\*\s*(.*)/);
  if (classesMatch) result.class_es = classesMatch[1].trim();

  const levelMatch = content.match(/-\s+\*\*Level:\*\*\s*(\d+)/);
  if (levelMatch) result.level = parseInt(levelMatch[1]);

  const typeMatch = content.match(/-\s+\*\*Type:\*\*\s+(.+)/);
  if (typeMatch) result.type = typeMatch[1].trim();

  const rarityMatch = content.match(/-\s+\*\*Rarity:\*\*\s+(.+)/);
  if (rarityMatch) result.rarity = rarityMatch[1].trim();

  const statusMatch = content.match(/-\s+\*\*Status:\*\*\s+(.+)/);
  if (statusMatch) result.status = statusMatch[1].trim();

  const tagsMatch = content.match(/-\s+\*\*Tags:\*\*\s+(.+)/);
  if (tagsMatch) {
    result.tags =
      tagsMatch[1].match(/#[\w-]+/g)?.map((t) => t.substring(1)) || [];
  }

  // Link Extraction
  const wikiLinkRegex = /\[\[(.+?)\]\]/g;
  const mdLinkRegex = /\[(.+?)\]\(\.\.\/([^\)]+?)\.md\)/g;
  let linkMatch;

  while ((linkMatch = wikiLinkRegex.exec(content)) !== null) {
    result.links.push({ name: linkMatch[1].trim(), type: "wiki" });
  }
  while ((linkMatch = mdLinkRegex.exec(content)) !== null) {
    const targetPath = linkMatch[2];
    result.links.push({
      name: linkMatch[1].trim(),
      targetName: path.basename(targetPath),
      path: targetPath,
      type: "markdown",
    });
  }

  const sections = [
    "Appearance",
    "Personality",
    "Role in Campaign",
    "Overview",
    "History",
    "Inhabitants",
    "Goals",
    "Beliefs",
    "Structure & Hierarchy",
    "Allies & Enemies",
    "Description",
    "Domains & Teachings",
    "Worship & Rituals",
    "Clergy & Followers",
    "History & Myths",
    "Puzzle Details",
    "The Puzzle",
    "The Solution",
    "Failure",
    "Background",
    "Backstory",
    "Secrets",
    "Suggested Encounters",
  ];
  sections.forEach((section) => {
    // Escape special characters for regex, specifically '&'
    const escapedSection = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sectionRegex = new RegExp(
      `## ${escapedSection}\\r?\\n+(.+?)(?=\\r?\\n##|<!--|$)`,
      "s",
    );
    const match = content.match(sectionRegex);
    if (match) {
      // Normalize keys to match database columns (e.g., "Domains & Teachings" -> "domains_teachings")
      const key = section
        .toLowerCase()
        .replace(/ & /g, "_")
        .replace(/[ &]/g, "_");
      result[key] = match[1].trim();
    }
  });

  if (result.suggested_encounters) {
    const encounters: any = {};
    const se = result.suggested_encounters;
    const low = se.match(/-\s+\*\*Low Level \(1-3\):\*\*\s*(.*)/);
    const mid = se.match(/-\s+\*\*Mid Level \(4-6\):\*\*\s*(.*)/);
    const high = se.match(/-\s+\*\*High Level \(7\+\):\*\*\s*(.*)/);
    if (low) encounters.low = low[1].trim();
    if (mid) encounters.mid = mid[1].trim();
    if (high) encounters.high = high[1].trim();
    result.encounters_json = encounters;
  }

  return result;
}
