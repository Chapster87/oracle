import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Adapter for managing database records via Supabase.
 */
export class SupabaseRecordManager {
  constructor(private supabase: SupabaseClient) {}

  async getRecords(model: string) {
    const { data, error } = await this.supabase.from(model).select("*");
    if (error) throw error;
    return data;
  }

  async getRecordById(model: string, id: string) {
    const { data, error } = await this.supabase
      .from(model)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async createRecord(model: string, data: any) {
    const { data: record, error } = await this.supabase
      .from(model)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return record;
  }

  async updateRecord(model: string, id: string, data: any) {
    const { data: record, error } = await this.supabase
      .from(model)
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return record;
  }

  async deleteRecord(model: string, id: string) {
    const { error } = await this.supabase.from(model).delete().eq("id", id);
    if (error) throw error;
  }
}
