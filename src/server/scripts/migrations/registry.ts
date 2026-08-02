import { normalize } from "./parser";

export class EntityRegistry {
  private registry: Record<string, string> = {};

  register(headerName: string, fileName: string, id: string) {
    this.registry[headerName] = id;
    this.registry[normalize(headerName)] = id;
    this.registry[fileName] = id;
    this.registry[normalize(fileName)] = id;
  }

  resolve(link: { name: string; targetName?: string }): string | null {
    return (
      this.registry[link.name] ||
      this.registry[normalize(link.name)] ||
      (link.targetName ? this.registry[link.targetName] : null) ||
      (link.targetName ? this.registry[normalize(link.targetName)] : null)
    );
  }

  getById(name: string): string | null {
    return this.registry[name] || null;
  }
}
