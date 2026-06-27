import { createClient } from './supabase';
import {
  loadState,
  saveState,
  loadChatHistory,
  saveChatHistory,
  type AppState,
  type Character,
  type ChatMessage,
} from './store';

type SyncResult = {
  synced: boolean;
  charactersSynced: number;
  messagesSynced: number;
  error?: string;
};

export async function syncToCloud(userId: string): Promise<SyncResult> {
  const supabase = createClient();
  const state = loadState();
  let charactersSynced = 0;
  let messagesSynced = 0;

  try {
    for (const char of state.characters) {
      const charRow = {
        id: char.id,
        user_id: userId,
        name: char.name,
        personality: char.personality ?? null,
        category: char.category ?? null,
        photo: char.photo ?? null,
        sprites: char.sprites ? JSON.parse(JSON.stringify(char.sprites)) : null,
        hp: char.hp,
        max_hp: char.maxHp,
        last_reset_date: char.lastResetDate || null,
        role: char.role || null,
        job: char.job || null,
        color: char.color || null,
        tier: char.tier ?? null,
        user_created: char.userCreated ?? false,
        sellable: char.sellable ?? false,
      };

      const { error: charError } = await supabase
        .from('characters')
        .upsert(charRow, { onConflict: 'id' });

      if (charError) {
        console.error(`sync character ${char.id}:`, charError.message);
        continue;
      }
      charactersSynced++;

      const messages = loadChatHistory(char.id);
      if (messages.length === 0) continue;

      const rows = messages.map(m => ({
        user_id: userId,
        character_id: char.id,
        role: m.role,
        content: m.content,
        created_at: new Date(m.timestamp).toISOString(),
      }));

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('character_id', char.id);

      if ((count ?? 0) < messages.length) {
        const { error: msgError } = await supabase
          .from('chat_messages')
          .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

        if (!msgError) {
          messagesSynced += messages.length;
        }
      }
    }

    return { synced: true, charactersSynced, messagesSynced };
  } catch (err) {
    return {
      synced: false,
      charactersSynced,
      messagesSynced,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function syncFromCloud(userId: string): Promise<SyncResult> {
  const supabase = createClient();
  const state = loadState();
  let charactersSynced = 0;
  let messagesSynced = 0;

  try {
    const { data: cloudChars, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId);

    if (charError) {
      return { synced: false, charactersSynced: 0, messagesSynced: 0, error: charError.message };
    }

    if (!cloudChars || cloudChars.length === 0) {
      return { synced: true, charactersSynced: 0, messagesSynced: 0 };
    }

    const localIds = new Set(state.characters.map(c => c.id));

    for (const row of cloudChars) {
      if (!localIds.has(row.id)) {
        const char: Character = {
          id: row.id,
          name: row.name,
          personality: row.personality ?? undefined,
          category: row.category ?? undefined,
          photo: row.photo ?? undefined,
          sprites: row.sprites ?? undefined,
          hp: row.hp ?? 100,
          maxHp: row.max_hp ?? 100,
          lastResetDate: row.last_reset_date ?? '',
          role: row.role ?? '',
          job: row.job ?? '',
          color: row.color ?? '#111',
          tier: row.tier ?? undefined,
          userCreated: row.user_created ?? false,
          sellable: row.sellable ?? false,
        };
        state.characters.push(char);
        charactersSynced++;
      }

      const { data: cloudMsgs } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .eq('character_id', row.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (cloudMsgs && cloudMsgs.length > 0) {
        const localMsgs = loadChatHistory(row.id);
        if (cloudMsgs.length > localMsgs.length) {
          const merged: ChatMessage[] = cloudMsgs.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
          }));
          saveChatHistory(row.id, merged);
          messagesSynced += merged.length;
        }
      }
    }

    if (charactersSynced > 0) {
      saveState(state);
    }

    return { synced: true, charactersSynced, messagesSynced };
  } catch (err) {
    return {
      synced: false,
      charactersSynced,
      messagesSynced,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function fullSync(userId: string): Promise<SyncResult> {
  const uploadResult = await syncToCloud(userId);
  const downloadResult = await syncFromCloud(userId);

  return {
    synced: uploadResult.synced && downloadResult.synced,
    charactersSynced: uploadResult.charactersSynced + downloadResult.charactersSynced,
    messagesSynced: uploadResult.messagesSynced + downloadResult.messagesSynced,
    error: uploadResult.error || downloadResult.error,
  };
}
