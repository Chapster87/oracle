# Oracle: TTRPG Campaign Management System

Oracle is a comprehensive campaign management system designed for Dungeon Masters (DMs) to organize, plan, and execute Tabletop Role-Playing Game (TTRPG) sessions. It serves as a central hub for world-building, character tracking, story progression, and rules reference.

## 🌟 Key Features

- **Campaign Management**: Organize your world with a dedicated structure for Episodes, Story Logs, and Future Planning.
- **Content Entities**: Track Characters (NPCs and PCs), Locations, Factions, Items, Religions, and Quest Hooks.
- **Integrated Ruleset**: Built-in support for the 5e Ruleset reference.
- **AI-Powered DM Assistants**: Leveraging Agent integration to help chronicle stories and forge new content.
- **RBAC Support**: Specialized views for both Dungeon Masters and Players.
- **Markdown-First Architecture**: High portability and AI-readiness using a hierarchical Markdown file system.

## 🏗️ Project Structure

```text
├── Campaign/           # World-building and session data
│   ├── Characters/     # NPC and PC profiles
│   ├── _Episodes/      # Recorded session logs
│   ├── Factions/       # Organizations and power structures
│   ├── Locations/      # Geographies and points of interest
│   └── ...             # Other campaign-specific entities
├── Rules/              # Reference materials (e.g., 5e Ruleset)
├── docs/               # Technical documentation, ADRs, and Research
├── src/                # Next.js Application Source
│   ├── app/            # App Router pages and layouts
│   ├── client/         # Client-side hooks and utilities
│   ├── server/         # Server-side scripts and API handlers
│   └── styles/         # Global and component-specific styles
├── supabase/           # Database migrations and configuration
└── CONTEXT.md          # High-level domain and project context
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Chapster87/oracle.git
   cd oracle
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials.

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🤖 Agent Integration

Oracle is built with AI agents in mind. The repository includes specific instructions and skills for agents to act as DM Assistants:

- **Chronicle Story**: Automatically updates session logs based on game events.
- **Forge Content**: Generates rich descriptions for NPCs, Locations, and more.
- **Wayfinder**: Assists in planning large-scale campaign arcs.

Refer to `AGENTS.md` and the `docs/agents/` directory for more details on agent capabilities and configuration.

## 📜 License

This project is licensed under the ISC License.
