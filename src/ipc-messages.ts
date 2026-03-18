export const IpcMessages = {
  // Window messages
  TOGGLE_CHAT_WINDOW: "clippy_toggle_chat_window",
  MINIMIZE_CHAT_WINDOW: "clippy_minimize_chat_window",
  MAXIMIZE_CHAT_WINDOW: "clippy_maximize_chat_window",
  MINIMIZE_MAIN_WINDOW: "clippy_minimize_main_window",
  MAXIMIZE_MAIN_WINDOW: "clippy_maximize_main_window",
  CLOSE_MAIN_WINDOW: "clippy_close_main_window",
  GET_MAIN_WINDOW_POSITION: "clippy_get_main_window_position",
  SET_MAIN_WINDOW_POSITION: "clippy_set_main_window_position",
  SET_BUBBLE_VIEW: "clippy_set_bubble_view",
  POPUP_APP_MENU: "clippy_popup_app_menu",

  // State messages
  STATE_CHANGED: "clippy_state_changed",
  STATE_GET_FULL: "clippy_state_get_full",
  STATE_GET: "clippy_state_get",
  STATE_SET: "clippy_state_set",
  STATE_OPEN_IN_EDITOR: "clippy_state_open_in_editor",

  // Debug messages
  DEBUG_STATE_GET_FULL: "clippy_debug_state_get_full",
  DEBUG_STATE_GET: "clippy_debug_state_get",
  DEBUG_STATE_SET: "clippy_debug_state_set",
  DEBUG_STATE_CHANGED: "clippy_debug_state_changed",
  DEBUG_STATE_OPEN_IN_EDITOR: "clippy_debug_state_open_in_editor",

  // App messages
  APP_CHECK_FOR_UPDATES: "clippy_app_check_for_updates",
  APP_GET_VERSIONS: "clippy_app__get_versions",
  APP_EXPORT_BACKUP: "clippy_app_export_backup",
  APP_IMPORT_BACKUP: "clippy_app_import_backup",
  APP_OPEN_POWERSHELL_LOG: "clippy_app_open_powershell_log",

  // Chat messages
  CHAT_GET_CHAT_RECORDS: "clippy_chat_get_chat_records",
  CHAT_GET_CHAT_WITH_MESSAGES: "clippy_chat_get_chat_with_messages",
  CHAT_WRITE_CHAT_WITH_MESSAGES: "clippy_chat_write_chat_with_messages",
  CHAT_DELETE_CHAT: "clippy_chat_delete_chat",
  CHAT_DELETE_ALL_CHATS: "clippy_chat_delete_all_chats",
  CHAT_NEW_CHAT: "clippy_chat_new_chat",
  CHAT_STREAM_START: "clippy_chat_stream_start",
  CHAT_STREAM_ABORT: "clippy_chat_stream_abort",
  CHAT_STREAM_CHUNK: "clippy_chat_stream_chunk",
  CHAT_STREAM_END: "clippy_chat_stream_end",
  CHAT_STREAM_ERROR: "clippy_chat_stream_error",
  CHAT_TRANSCRIBE_AUDIO: "clippy_chat_transcribe_audio",

  // Clipboard
  CLIPBOARD_WRITE: "clippy_clipboard_write",

  // Memory
  MEMORY_GET_ALL: "clippy_memory_get_all",
  MEMORY_GET: "clippy_memory_get",
  MEMORY_CREATE: "clippy_memory_create",
  MEMORY_UPDATE: "clippy_memory_update",
  MEMORY_DELETE: "clippy_memory_delete",
  MEMORY_SEARCH: "clippy_memory_search",
  MEMORY_GET_STATS: "clippy_memory_get_stats",
  MEMORY_UPDATE_STATS: "clippy_memory_update_stats",
  MEMORY_PROCESS_TURN: "clippy_memory_process_turn",
  MEMORY_RECORD_ACTION: "clippy_memory_record_action",
  MEMORY_HANDLE_COMMAND: "clippy_memory_handle_command",
  MEMORY_RUN_MAINTENANCE: "clippy_memory_run_maintenance",
  MEMORY_DELETE_ALL: "clippy_memory_delete_all",

  // Identity & User Profile
  IDENTITY_GET: "clippy_identity_get",
  IDENTITY_SET: "clippy_identity_set",
  USER_GET: "clippy_user_get",
  USER_SET: "clippy_user_set",

  // Desktop Tools
  DESKTOP_TOOL_EXECUTE: "clippy_desktop_tool_execute",
  DESKTOP_TOOL_GET_SCHEMA: "clippy_desktop_tool_get_schema",

  // Web Tools
  WEB_SEARCH: "clippy_web_search",
  FETCH_URL: "clippy_fetch_url",
};
