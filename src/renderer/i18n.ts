export type Language = "en" | "th";

export interface Translations {
  // General & Navigation
  chat_with_clippy: string;
  chats: string;
  settings: string;
  bond: string;
  joy: string;
  back_to_chat: string;
  clippy_control_panel: string;
  settings_description: string;
  appearance: string;
  ai_provider: string;
  prompts: string;
  memory: string;
  identity: string;
  about_you: string;
  advanced: string;
  about: string;
  ui_language: string;
  save_changes: string;
  saving: string;
  saved: string;
  profile_updated: string;
  type_message: string;
  add_images: string;
  recording: string;
  transcribing: string;
  enter_to_send: string;
  shift_enter: string;
  provide_api_key: string;
  clippy_is_thinking: string;
  clippy_is_responding: string;
  clippy_is_listening: string;
  preview: string;
  last_updated: string;
  restore_chat: string;
  delete_selected: string;
  delete_all_chats: string;
  confirm_delete_chat: string;
  confirm_delete_all: string;
  loading: string;
  name: string;
  emoji: string;
  cancel: string;
  reset: string;
  never: string;

  // Appearance Settings
  window_options: string;
  show_title_bar: string;
  always_on_top: string;
  transparency: string;
  font_settings: string;
  font_face: string;
  font_size: string;
  language_options: string;
  appearance_description: string;
  clippy_always_on_top: string;
  chat_always_on_top: string;
  always_open_chat: string;
  font_options: string;
  font_type: string;
  reset_appearance: string;
  theme_colors: string;
  theme_preset: string;
  theme_classic: string;
  theme_ocean: string;
  theme_forest: string;
  theme_sunset: string;
  theme_midnight: string;
  theme_custom: string;
  custom_theme_colors: string;
  theme_background: string;
  theme_panel: string;
  theme_title_bar: string;
  theme_accent: string;
  theme_text: string;
  first_run_title: string;
  first_run_description: string;
  first_run_language_hint: string;
  first_run_api_hint: string;
  first_run_finish: string;
  first_run_finish_later: string;

  // AI Provider / Model Settings
  ai_provider_description: string;
  use_hosted_ai: string;
  provider: string;
  api_key: string;
  key_saved: string;
  no_key_saved: string;
  clear_key: string;
  key_hint: string;
  model: string;
  use_default_model: string;
  default_for: string;
  api_benefits_title: string;
  api_benefit_1: string;
  api_benefit_2: string;
  api_benefit_3: string;
  api_benefit_4: string;

  // Prompts / Parameters
  prompts_description: string;
  system_prompt_legend: string;
  system_prompt_description: string;
  system_prompt_label: string;
  confirm_reset_prompt: string;
  parameters: string;
  top_k: string;
  temperature: string;

  // Identity Settings
  identity_description: string;
  basic_info: string;
  personality: string;
  vibe: string;
  mission: string;
  preview_label: string;
  identity_updated: string;

  // Memory Settings
  memory_legend: string;
  memory_description: string;
  relationship_stats: string;
  bond_level: string;
  happiness: string;
  total_interactions: string;
  last_interaction: string;
  search_filter: string;
  search_memories: string;
  category: string;
  all_categories: string;
  add_memory: string;
  delete_all: string;
  edit_memory: string;
  add_new_memory: string;
  content: string;
  importance: string;
  importance_label: string;
  memory_retention: string;
  retention_short_term: string;
  retention_long_term: string;
  update: string;
  create: string;
  memories: string;
  no_memories_found: string;
  no_memories_yet: string;
  memory_review: string;
  run_cleanup_now: string;
  potential_conflicts: string;
  keep_newest: string;
  review_manually: string;

  // Memory Categories
  fact: string;
  preference: string;
  event: string;
  relationship: string;

  // Relationship Levels
  best_friends: string;
  close_friends: string;
  friends: string;
  acquaintances: string;
  strangers: string;

  // Moods
  ecstatic: string;
  happy: string;
  content_mood: string;
  neutral: string;
  sad: string;
  current_mood: string;
  todo_list: string;
  todo_empty: string;
  todo_open: string;
  todo_done: string;
  todo_pending: string;
  todo_mark_done: string;
  todo_mark_pending: string;
  todo_delete: string;
  todo_added: string;
  choose_one: string;
  type_your_own: string;
  send_custom_choice: string;
  custom_reply_placeholder: string;
  social_battery: string;
  response_style: string;
  user_tone: string;
  mood_calm: string;
  mood_playful: string;
  mood_supportive: string;
  mood_excited: string;
  mood_focused: string;
  mood_concerned: string;
  response_gentle: string;
  response_balanced: string;
  response_energetic: string;
  tone_neutral: string;
  tone_positive: string;
  tone_affectionate: string;
  tone_curious: string;
  tone_distressed: string;
  tone_frustrated: string;

  // About Settings
  about_description: string;
  version: string;
  license: string;
  made_with_love: string;
  clippy_homage: string;
  acknowledgments: string;
  made_by: string;
  using: string;
  character_design: string;
  legal_notice: string;

  // User Settings
  user_description: string;
  username_label: string;
  nickname: string;
  pronouns: string;
  timezone: string;
  comm_preferences: string;
  comm_style: string;
  comm_style_placeholder: string;
  response_length: string;
  tone: string;
  professional: string;
  casual: string;
  playful: string;
  formal: string;
  short: string;
  medium: string;
  long: string;
  other_notes: string;
  user_notes_placeholder: string;

  // Advanced Settings
  advanced_description: string;
  powershell_mode: string;
  powershell_mode_description: string;
  powershell_mode_safe: string;
  powershell_mode_full: string;
  powershell_mode_saved: string;
  open_powershell_log: string;
  powershell_log_opened: string;
  powershell_confirm_title: string;
  powershell_confirm_message: string;
  auto_updates: string;
  auto_updates_label: string;
  check_for_updates: string;
  configuration: string;
  configuration_description: string;
  open_config_file: string;
  open_debug_file: string;
  export_backup: string;
  import_backup: string;
  backup_description: string;
  backup_exported: string;
  backup_imported: string;
  backup_failed: string;
  validation_api_invalid: string;
  validation_model_required: string;
  validation_theme_invalid: string;
  tts_title: string;
  tts_description: string;
  tts_voice_settings: string;
  tts_enable: string;
  tts_voice: string;
  tts_speed: string;
  tts_preview: string;
  tts_preview_description: string;
  tts_test_voice: string;
  tts_playing: string;
  tts_save_settings: string;
  tavily_api_key: string;
  tavily_description: string;
  save_settings: string;
  settings_saved_successfully: string;

  // Welcome Message
  welcome_to_clippy: string;
  welcome_description: string;
  api_ready_message: string;
  api_not_configured_message: string;
  click_clippy_head_tip: string;
  check_ai_settings: string;
  configure_ai_provider: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    chat_with_clippy: "Chat with Clippy",
    chats: "Chats",
    settings: "Settings",
    bond: "Bond",
    joy: "Joy",
    back_to_chat: "Back to Chat",
    clippy_control_panel: "Clippy Control Panel",
    settings_description:
      "Keep the classic desktop feel, but make everyday chat setup easier and cleaner.",
    appearance: "Appearance",
    ai_provider: "AI Provider",
    prompts: "Prompts",
    memory: "Memory",
    identity: "Identity",
    about_you: "About You",
    advanced: "Advanced",
    about: "About",
    ui_language: "UI Language",
    save_changes: "Save Changes",
    saving: "Saving...",
    saved: "Saved!",
    profile_updated: "Profile updated successfully!",
    type_message: "Type a message...",
    add_images: "Add image",
    recording: "Recording... Click again to send",
    transcribing: "Transcribing your voice...",
    enter_to_send: "Enter to send",
    shift_enter: "Shift+Enter for a new line",
    provide_api_key: "Add your API key in Settings to begin",
    clippy_is_thinking: "Clippy is thinking...",
    clippy_is_responding: "Clippy is replying...",
    clippy_is_listening: "Clippy is listening carefully...",
    preview: "Preview",
    last_updated: "Last Updated",
    restore_chat: "Restore Chat",
    delete_selected: "Delete Selected",
    delete_all_chats: "Delete All Chats",
    confirm_delete_chat: "Are you sure you want to delete this?",
    confirm_delete_all:
      "Are you sure you want to delete EVERYTHING? This cannot be undone.",
    loading: "Loading...",
    name: "Name",
    emoji: "Emoji",
    cancel: "Cancel",
    reset: "Reset",
    never: "Never",

    window_options: "Window Options",
    show_title_bar: "Show Title Bar",
    always_on_top: "Always on Top",
    transparency: "Window Transparency",
    font_settings: "Font Settings",
    font_face: "Font Face",
    font_size: "Font Size",
    language_options: "Language Options",
    appearance_description: "Customize Clippy's appearance and behavior.",
    clippy_always_on_top: "Clippy Always on Top",
    chat_always_on_top: "Chat Always on Top",
    always_open_chat: "Always Open Chat",
    font_options: "Font Options",
    font_type: "Font Type",
    reset_appearance: "Reset Appearance",
    theme_colors: "Theme Colors",
    theme_preset: "Theme Preset",
    theme_classic: "Classic Cream",
    theme_ocean: "Ocean Blue",
    theme_forest: "Forest Moss",
    theme_sunset: "Sunset Peach",
    theme_midnight: "Midnight Ink",
    theme_custom: "Custom Theme",
    custom_theme_colors: "Custom Theme Colors",
    theme_background: "Background",
    theme_panel: "Panel",
    theme_title_bar: "Title Bar",
    theme_accent: "Accent",
    theme_text: "Text",
    first_run_title: "Set Up Clippy",
    first_run_description:
      "Choose your language, AI provider, API key, and favorite theme to get started.",
    first_run_language_hint: "You can change these anytime later in Settings.",
    first_run_api_hint:
      "You can continue without a key for now, then add it later when you're ready.",
    first_run_finish: "Finish Setup",
    first_run_finish_later: "Do This Later",

    ai_provider_description: "Select which AI brain powers Clippy.",
    use_hosted_ai: "Connect Clippy to an AI provider",
    provider: "Provider",
    api_key: "API Key",
    key_saved: "Key securely saved.",
    no_key_saved: "No key saved yet.",
    clear_key: "Clear Key",
    key_hint:
      "Your key is stored locally on this machine and never sent elsewhere except to the AI provider.",
    model: "AI Model",
    use_default_model: "Use Default Model",
    default_for: "Default for",
    api_benefits_title: "Why use an API provider?",
    api_benefit_1:
      "Access to more powerful models (GPT-4, Claude 3, Gemini Pro)",
    api_benefit_2: "Better memory and reasoning capabilities",
    api_benefit_3: "Faster response times",
    api_benefit_4: "Support for multi-modal features like image analysis",

    prompts_description: "Define Clippy's base instructions.",
    system_prompt_legend: "System Prompt",
    system_prompt_description: "Base instructions for the AI on how to behave.",
    system_prompt_label: "System Prompt",
    confirm_reset_prompt:
      "Are you sure you want to reset the system prompt to default?",
    parameters: "Parameters",
    top_k: "Top K",
    temperature: "Temperature",

    identity_description:
      "Customize who Clippy is. This defines Clippy's personality and mission.",
    basic_info: "Basic Info",
    personality: "Personality",
    vibe: "Vibe",
    mission: "Mission",
    preview_label: "Preview",
    identity_updated: "Identity updated successfully!",

    memory_legend: "Memory (Long-term Knowledge)",
    memory_description:
      "This is what Clippy remembers about you (personal info, style, preferences). You can edit this to help Clippy understand you better.",
    relationship_stats: "Relationship & Stats",
    bond_level: "Bond Level",
    happiness: "Happiness",
    total_interactions: "Total Interactions",
    last_interaction: "Last Interaction",
    search_filter: "Search & Filter",
    search_memories: "Search memories...",
    category: "Category",
    all_categories: "All Categories",
    add_memory: "Add Memory",
    delete_all: "Delete All",
    edit_memory: "Edit Memory",
    add_new_memory: "Add New Memory",
    content: "Content",
    importance: "Importance",
    importance_label: "Importance",
    memory_retention: "Retention",
    retention_short_term: "Short-term",
    retention_long_term: "Long-term",
    update: "Update",
    create: "Create",
    memories: "Memories",
    no_memories_found: "No memories found matching your search.",
    no_memories_yet: "No memories stored yet. Talk to Clippy more!",
    memory_review: "Memory Review",
    run_cleanup_now: "Run Cleanup Now",
    potential_conflicts: "Potential Conflicts",
    keep_newest: "Keep Newest",
    review_manually: "Review Manually",

    fact: "Fact",
    preference: "Preference",
    event: "Event",
    relationship: "Relationship",

    best_friends: "Best Friends",
    close_friends: "Close Friends",
    friends: "Friends",
    acquaintances: "Acquaintances",
    strangers: "Strangers",

    ecstatic: "Ecstatic",
    happy: "Happy",
    content_mood: "Content",
    neutral: "Neutral",
    sad: "Sad",
    current_mood: "Current Mood",
    todo_list: "TODO List",
    todo_empty:
      "No TODOs yet. When Clippy helps plan something, it can add items here.",
    todo_open: "TODOs",
    todo_done: "Done",
    todo_pending: "Pending",
    todo_mark_done: "Mark Done",
    todo_mark_pending: "Mark Pending",
    todo_delete: "Delete",
    todo_added: "Added to your TODO list.",
    choose_one: "Choose one",
    type_your_own: "Type my own answer",
    send_custom_choice: "Send Reply",
    custom_reply_placeholder: "Type your own response...",
    social_battery: "Social Battery",
    response_style: "Response Style",
    user_tone: "User Tone",
    mood_calm: "Calm",
    mood_playful: "Playful",
    mood_supportive: "Supportive",
    mood_excited: "Excited",
    mood_focused: "Focused",
    mood_concerned: "Concerned",
    response_gentle: "Gentle",
    response_balanced: "Balanced",
    response_energetic: "Energetic",
    tone_neutral: "Neutral",
    tone_positive: "Positive",
    tone_affectionate: "Affectionate",
    tone_curious: "Curious",
    tone_distressed: "Distressed",
    tone_frustrated: "Frustrated",

    about_description:
      "The 90's office assistant brought back as an AI companion.",
    version: "Version",
    license: "License",
    made_with_love: "Made with ❤️ for everyone who misses the good old days.",
    clippy_homage:
      "This project is a whimsical homage to the classic desktop assistants of the 90s.",
    acknowledgments: "Acknowledgments",
    made_by: "Built by",
    using: "using",
    character_design:
      "Character design and original inspiration based on Microsoft's Clippy.",
    legal_notice:
      "Clippy is an unofficial fan project and is not affiliated with Microsoft.",

    user_description:
      "Tell Clippy a bit about yourself. This helps Clippy remember your name and preferences.",
    username_label: "Your Name",
    nickname: "Nickname",
    pronouns: "Pronouns",
    timezone: "Timezone",
    comm_preferences: "Communication Preferences",
    comm_style: "Communication Style",
    comm_style_placeholder: "Warm, direct, playful, detailed...",
    response_length: "Response Length",
    tone: "Tone",
    professional: "Professional",
    casual: "Casual",
    playful: "Playful",
    formal: "Formal",
    short: "Short",
    medium: "Medium",
    long: "Long",
    other_notes: "Other Notes",
    user_notes_placeholder:
      "Anything else Clippy should remember about how you'd like to chat?",

    advanced_description:
      "Fine-tune updates, memory, and local configuration tools.",
    powershell_mode: "PowerShell Mode",
    powershell_mode_description:
      "Safe mode allows read-only system exploration. Full mode runs PowerShell directly but still blocks dangerous commands and logs every execution.",
    powershell_mode_safe: "Safe Mode",
    powershell_mode_full: "Full Mode",
    powershell_mode_saved: "PowerShell mode updated.",
    open_powershell_log: "Open PowerShell Log",
    powershell_log_opened: "PowerShell log opened.",
    powershell_confirm_title: "Confirm PowerShell Command",
    powershell_confirm_message:
      "Full Mode is about to run this PowerShell command. Review it carefully before continuing.",
    auto_updates: "Auto Updates",
    auto_updates_label: "Automatically check for app updates",
    check_for_updates: "Check for Updates",
    configuration: "Configuration",
    configuration_description:
      "Open Clippy's local configuration and debug files in your editor.",
    open_config_file: "Open Config File",
    open_debug_file: "Open Debug File",
    export_backup: "Export Backup",
    import_backup: "Import Backup",
    backup_description:
      "Export or restore Clippy settings, chats, memories, and theme in one file.",
    backup_exported: "Backup exported successfully.",
    backup_imported: "Backup imported successfully.",
    backup_failed: "Backup operation failed.",
    validation_api_invalid:
      "API key format does not match the selected provider.",
    validation_model_required: "Please enter a model name.",
    validation_theme_invalid: "One or more custom theme colors are invalid.",
    tts_title: "Text-to-Speech",
    tts_description: "Configure how Clippy speaks to you.",
    tts_voice_settings: "Voice Settings",
    tts_enable: "Enable TTS",
    tts_voice: "Voice",
    tts_speed: "Speed",
    tts_preview: "Preview",
    tts_preview_description:
      'Click "Test Voice" to hear how Clippy will sound.',
    tts_test_voice: "Test Voice",
    tts_playing: "Playing...",
    tts_save_settings: "Save Settings",
    tavily_api_key: "Tavily API Key",
    tavily_description:
      "Enter your Tavily API key for web search. Get a free key at app.tavily.com.",
    save_settings: "Save Settings",
    settings_saved_successfully: "Settings saved successfully!",

    welcome_to_clippy: "Welcome to Clippy! 📎✨",
    welcome_description:
      'We brought back Clippy as **"Clippy"** to be your best AI friend that responds quickly and intelligently through your chosen API provider.',
    api_ready_message: "API is ready through {provider}! Start typing to chat",
    api_not_configured_message:
      "No API key yet: Go to Settings to choose provider and add key before chatting",
    click_clippy_head_tip:
      "💡 Click Clippy's head to open/close this window anytime",
    check_ai_settings: "Check AI Settings",
    configure_ai_provider: "Configure AI Provider",
  },
  th: {
    chat_with_clippy: "คุยกับ Clippy",
    chats: "แชท",
    settings: "ตั้งค่า",
    bond: "ความสนิท",
    joy: "ความสุข",
    back_to_chat: "กลับไปที่แชท",
    clippy_control_panel: "แผงควบคุม Clippy",
    settings_description:
      "คงความรู้สึกคลาสสิก แต่ตั้งค่าการใช้งานได้ง่ายและสะอาดตาขึ้น",
    appearance: "รูปลักษณ์",
    ai_provider: "ผู้ให้บริการ AI",
    prompts: "คำสั่ง (Prompts)",
    memory: "ความจำ",
    identity: "ตัวตน",
    about_you: "เกี่ยวกับคุณ",
    advanced: "ขั้นสูง",
    about: "เกี่ยวกับ",
    ui_language: "ภาษาของ UI",
    save_changes: "บันทึกการเปลี่ยนแปลง",
    saving: "กำลังบันทึก...",
    saved: "บันทึกแล้ว!",
    profile_updated: "อัปเดตโปรไฟล์เรียบร้อยแล้ว!",
    type_message: "พิมพ์ข้อความ...",
    add_images: "เพิ่มรูปภาพ",
    recording: "กำลังบันทึกเสียง... คลิกอีกครั้งเพื่อส่ง",
    transcribing: "กำลังถอดความจากเสียงของคุณ...",
    enter_to_send: "Enter เพื่อส่ง",
    shift_enter: "Shift+Enter เพื่อเริ่มบรรทัดใหม่",
    provide_api_key: "เพิ่ม API Key ในการตั้งค่าเพื่อเริ่มต้น",
    clippy_is_thinking: "Clippy กำลังใช้ความคิด...",
    clippy_is_responding: "Clippy กำลังตอบกลับ...",
    clippy_is_listening: "Clippy กำลังตั้งใจฟัง...",
    preview: "ตัวอย่าง",
    last_updated: "อัปเดตล่าสุด",
    restore_chat: "กู้คืนแชท",
    delete_selected: "ลบที่เลือก",
    delete_all_chats: "ลบแชททั้งหมด",
    confirm_delete_chat: "คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งนี้?",
    confirm_delete_all:
      "คุณแน่ใจหรือไม่ว่าต้องการลบทุกอย่าง? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
    loading: "กำลังโหลด...",
    name: "ชื่อ",
    emoji: "อิโมจิ",
    cancel: "ยกเลิก",
    reset: "รีเซ็ต",
    never: "ไม่เคย",

    window_options: "ตัวเลือกหน้าต่าง",
    show_title_bar: "แสดงแถบหัวข้อ",
    always_on_top: "อยู่บนสุดเสมอ",
    transparency: "ความโปร่งใสของหน้าต่าง",
    font_settings: "การตั้งค่าฟอนต์",
    font_face: "ชื่อฟอนต์",
    font_size: "ขนาดฟอนต์",
    language_options: "ตัวเลือกภาษา",
    appearance_description: "ปรับแต่งรูปลักษณ์และพฤติกรรมของ Clippy",
    clippy_always_on_top: "Clippy อยู่บนสุดเสมอ",
    chat_always_on_top: "แชทอยู่บนสุดเสมอ",
    always_open_chat: "เปิดแชทเสมอ",
    font_options: "ตัวเลือกฟอนต์",
    font_type: "ประเภทฟอนต์",
    reset_appearance: "รีเซ็ตรูปลักษณ์",
    theme_colors: "โทนสีธีม",
    theme_preset: "ชุดสีธีม",
    theme_classic: "ครีมคลาสสิก",
    theme_ocean: "น้ำเงินทะเล",
    theme_forest: "เขียวมอส",
    theme_sunset: "พีชยามเย็น",
    theme_midnight: "หมึกยามค่ำ",
    theme_custom: "ธีมกำหนดเอง",
    custom_theme_colors: "สีของธีมกำหนดเอง",
    theme_background: "พื้นหลัง",
    theme_panel: "แผง",
    theme_title_bar: "แถบหัวข้อ",
    theme_accent: "สีเน้น",
    theme_text: "ข้อความ",
    first_run_title: "เริ่มตั้งค่า Clippy",
    first_run_description:
      "เลือกภาษา ผู้ให้บริการ AI, API key และธีมที่ชอบก่อนเริ่มใช้งาน",
    first_run_language_hint:
      "คุณสามารถกลับมาเปลี่ยนค่าเหล่านี้ได้ใน Settings ภายหลัง",
    first_run_api_hint:
      "ถ้ายังไม่มี key ตอนนี้ก็ข้ามไปก่อนได้ แล้วค่อยมาเพิ่มภายหลัง",
    first_run_finish: "เริ่มใช้งาน",
    first_run_finish_later: "ไว้ทำทีหลัง",

    ai_provider_description: "เลือกสมอง AI ที่จะขับเคลื่อน Clippy",
    use_hosted_ai: "เชื่อมต่อ Clippy กับผู้ให้บริการ AI",
    provider: "ผู้ให้บริการ",
    api_key: "API Key",
    key_saved: "บันทึกคีย์อย่างปลอดภัยแล้ว",
    no_key_saved: "ยังไม่ได้บันทึกคีย์",
    clear_key: "ลบคีย์",
    key_hint:
      "คีย์ของคุณจะถูกเก็บไว้ในเครื่องนี้เท่านั้น และจะไม่ถูกส่งไปที่อื่นยกเว้นผู้ให้บริการ AI",
    model: "รุ่น (Model) ของ AI",
    use_default_model: "ใช้โมเดลเริ่มต้น",
    default_for: "เริ่มต้นสำหรับ",
    api_benefits_title: "ทำไมต้องใช้ผู้ให้บริการ API?",
    api_benefit_1: "เข้าถึงโมเดลที่ทรงพลังกว่า (GPT-4, Claude 3, Gemini Pro)",
    api_benefit_2: "มีความสามารถในการจดจำและให้เหตุผลที่ดีกว่า",
    api_benefit_3: "ตอบสนองได้รวดเร็วขึ้น",
    api_benefit_4: "รองรับฟีเจอร์ที่หลากหลาย เช่น การวิเคราะห์รูปภาพ",

    prompts_description: "กำหนดคำสั่งพื้นฐานสำหรับ Clippy",
    system_prompt_legend: "System Prompt (คำสั่งระบบ)",
    system_prompt_description: "คำสั่งหลักเพื่อให้ AI ทราบว่าควรแสดงตนอย่างไร",
    system_prompt_label: "System Prompt",
    confirm_reset_prompt:
      "คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตคำสั่งระบบเป็นค่าเริ่มต้น?",
    parameters: "พารามิเตอร์",
    top_k: "Top K",
    temperature: "Temperature",

    identity_description: "กำหนดตัวตนของ Clippy เพื่อระบุบุคลิกภาพและพันธกิจ",
    basic_info: "ข้อมูลพื้นฐาน",
    personality: "บุคลิกภาพ",
    vibe: "คาแรกเตอร์",
    mission: "พันธกิจ",
    preview_label: "ตัวอย่าง",
    identity_updated: "อัปเดตตัวตนเรียบร้อยแล้ว!",

    memory_legend: "ความจำ (ความรู้ระยะยาว)",
    memory_description:
      "นี่คือสิ่งที่ Clippy จำได้เกี่ยวกับคุณ (ข้อมูลส่วนตัว, สไตล์ที่ชอบ, ความชอบส่วนตัว) คุณสามารถแก้ไขข้อมูลนี้เพื่อให้ Clippy เข้าใจคุณมากขึ้น",
    relationship_stats: "ความสัมพันธ์และสถิติ",
    bond_level: "ระดับความสนิท",
    happiness: "ความสุข",
    total_interactions: "การโต้ตอบทั้งหมด",
    last_interaction: "การโต้ตอบล่าสุด",
    search_filter: "ค้นหาและกรอง",
    search_memories: "ค้นหาความจำ...",
    category: "หมวดหมู่",
    all_categories: "ทุกหมวดหมู่",
    add_memory: "เพิ่มความจำ",
    delete_all: "ลบทัดหมด",
    edit_memory: "แก้ไขความจำ",
    add_new_memory: "เพิ่มความจำใหม่",
    content: "เนื้อหา",
    importance: "ความสำคัญ",
    importance_label: "ความสำคัญ",
    memory_retention: "การคงอยู่",
    retention_short_term: "ชั่วคราว",
    retention_long_term: "ระยะยาว",
    update: "อัปเดต",
    create: "สร้าง",
    memories: "ความจำ",
    no_memories_found: "ไม่พบความจำที่ตรงกับการค้นหา",
    no_memories_yet:
      "ยังไม่มีความจำถูกบันทึกไว้ ลองคุยกับ Clippy ให้มากขึ้นสิ!",
    memory_review: "ตรวจทานความจำ",
    run_cleanup_now: "จัดระเบียบตอนนี้",
    potential_conflicts: "ความจำที่อาจขัดกัน",
    keep_newest: "เก็บอันล่าสุด",
    review_manually: "ตรวจเอง",

    fact: "ข้อเท็จจริง",
    preference: "ความชอบ",
    event: "เหตุการณ์",
    relationship: "ความสัมพันธ์",

    best_friends: "เพื่อนรัก",
    close_friends: "เพื่อนสนิท",
    friends: "เพื่อน",
    acquaintances: "คนรู้จัก",
    strangers: "คนแปลกหน้า",

    ecstatic: "ปลาบปลื้ม",
    happy: "มีความสุข",
    content_mood: "พึงพอใจ",
    neutral: "ปกติ",
    sad: "เศร้า",
    current_mood: "อารมณ์ตอนนี้",
    todo_list: "รายการ TODO",
    todo_empty:
      "ยังไม่มี TODO ตอนนี้ ถ้า Clippy ช่วยวางแผนอะไรให้ รายการจะมาแสดงตรงนี้",
    todo_open: "TODO",
    todo_done: "เสร็จแล้ว",
    todo_pending: "ค้างอยู่",
    todo_mark_done: "ทำเสร็จแล้ว",
    todo_mark_pending: "ทำต่อภายหลัง",
    todo_delete: "ลบ",
    todo_added: "เพิ่มเข้า TODO แล้ว",
    choose_one: "เลือกได้เลย",
    type_your_own: "พิมพ์คำตอบเอง",
    send_custom_choice: "ส่งคำตอบ",
    custom_reply_placeholder: "พิมพ์คำตอบของคุณเอง...",
    social_battery: "พลังเข้าสังคม",
    response_style: "สไตล์การตอบ",
    user_tone: "โทนของผู้ใช้",
    mood_calm: "นิ่งและอบอุ่น",
    mood_playful: "ขี้เล่น",
    mood_supportive: "ปลอบโยน",
    mood_excited: "ตื่นเต้น",
    mood_focused: "โฟกัส",
    mood_concerned: "เป็นห่วง",
    response_gentle: "นุ่มนวล",
    response_balanced: "สมดุล",
    response_energetic: "มีพลัง",
    tone_neutral: "ปกติ",
    tone_positive: "เชิงบวก",
    tone_affectionate: "อบอุ่นเป็นกันเอง",
    tone_curious: "อยากรู้",
    tone_distressed: "กำลังกังวลหรือเศร้า",
    tone_frustrated: "หงุดหงิด",

    about_description:
      "ผู้ช่วยสำนักงานยุค 90 ที่กลับมาอีกครั้งในรูปแบบเพื่อน AI",
    version: "เวอร์ชัน",
    license: "สัญญาอนุญาต",
    made_with_love: "สร้างด้วย ❤️ สำหรับทุกคนที่คิดถึงวันวาน",
    clippy_homage:
      "โปรเจกต์นี้เป็นการแสดงความรำลึกถึงผู้ช่วยเดสก์ท็อปคลาสสิกในยุค 90",
    acknowledgments: "กิตติกรรมประกาศ",
    made_by: "สร้างโดย",
    using: "โดยใช้",

    character_design:
      "การออกแบบตัวละครและแรงบันดาลใจดั้งเดิมอ้างอิงจาก Clippy ของ Microsoft",
    legal_notice:
      "Clippy เป็นโปรเจกต์แฟนเมดที่ไม่เป็นทางการ และไม่ได้เกี่ยวข้องกับ Microsoft",

    user_description:
      "บอกเล่าเรื่องราวของคุณให้ Clippy ฟัง เพื่อช่วยให้ Clippy จำชื่อและความชอบของคุณได้",
    username_label: "ชื่อของคุณ",
    nickname: "ชื่อเล่น",
    pronouns: "สรรพนาม",
    timezone: "เขตเวลา",
    comm_preferences: "รูปแบบการสื่อสาร",
    comm_style: "สไตล์การคุย",
    comm_style_placeholder: "เช่น เป็นกันเอง ตรงประเด็น ขี้เล่น ละเอียด",
    response_length: "ความยาวคำตอบ",
    tone: "โทนการตอบ",
    professional: "ทางการแบบมืออาชีพ",
    casual: "สบาย ๆ",
    playful: "ขี้เล่น",
    formal: "ทางการ",
    short: "สั้น",
    medium: "ปานกลาง",
    long: "ยาว",
    other_notes: "หมายเหตุเพิ่มเติม",
    user_notes_placeholder:
      "มีอะไรอีกไหมที่อยากให้ Clippy จำเกี่ยวกับวิธีคุยกับคุณ",

    advanced_description:
      "ปรับแต่งการอัปเดต ความจำ และเครื่องมือไฟล์ตั้งค่าในเครื่อง",
    powershell_mode: "โหมด PowerShell",
    powershell_mode_description:
      "Safe mode อนุญาตเฉพาะคำสั่งแนวอ่านข้อมูลและสำรวจระบบ ส่วน Full mode จะรัน PowerShell ตรง ๆ แต่ยังบล็อกคำสั่งอันตรายและบันทึก log ทุกครั้ง",
    powershell_mode_safe: "Safe Mode",
    powershell_mode_full: "Full Mode",
    powershell_mode_saved: "อัปเดตโหมด PowerShell แล้ว",
    open_powershell_log: "เปิด PowerShell Log",
    powershell_log_opened: "เปิด PowerShell log แล้ว",
    powershell_confirm_title: "ยืนยันคำสั่ง PowerShell",
    powershell_confirm_message:
      "Full Mode กำลังจะรันคำสั่ง PowerShell นี้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการต่อ",
    auto_updates: "การอัปเดตอัตโนมัติ",
    auto_updates_label: "ตรวจสอบอัปเดตแอปโดยอัตโนมัติ",
    check_for_updates: "ตรวจสอบอัปเดต",
    configuration: "ไฟล์ตั้งค่า",
    configuration_description:
      "เปิดไฟล์ตั้งค่าและไฟล์ดีบักของ Clippy ด้วยตัวแก้ไขข้อความ",
    open_config_file: "เปิดไฟล์ตั้งค่า",
    open_debug_file: "เปิดไฟล์ดีบัก",
    export_backup: "ส่งออกแบ็กอัป",
    import_backup: "นำเข้าแบ็กอัป",
    backup_description:
      "ส่งออกหรือกู้คืนการตั้งค่า แชท ความจำ และธีมของ Clippy ในไฟล์เดียว",
    backup_exported: "ส่งออกแบ็กอัปเรียบร้อยแล้ว",
    backup_imported: "นำเข้าแบ็กอัปเรียบร้อยแล้ว",
    backup_failed: "การจัดการแบ็กอัปล้มเหลว",
    validation_api_invalid: "รูปแบบ API key ไม่ตรงกับผู้ให้บริการที่เลือก",
    validation_model_required: "กรุณาใส่ชื่อโมเดล",
    validation_theme_invalid: "สีของ custom theme ไม่ถูกต้องอย่างน้อยหนึ่งค่า",
    tts_title: "ข้อความเป็นเสียงพูด",
    tts_description: "ตั้งค่าวิธีที่ Clippy จะพูดกับคุณ",
    tts_voice_settings: "การตั้งค่าเสียง",
    tts_enable: "เปิดใช้ TTS",
    tts_voice: "เสียง",
    tts_speed: "ความเร็ว",
    tts_preview: "ทดลองเสียง",
    tts_preview_description: 'กด "ทดสอบเสียง" เพื่อฟังว่า Clippy จะพูดอย่างไร',
    tts_test_voice: "ทดสอบเสียง",
    tts_playing: "กำลังเล่น...",
    tts_save_settings: "บันทึกการตั้งค่า",
    tavily_api_key: "Tavily API Key",
    tavily_description:
      "ใส่ Tavily API key สำหรับเว็บเสิร์ช โดยสมัครฟรีได้ที่ app.tavily.com",
    save_settings: "บันทึกการตั้งค่า",
    settings_saved_successfully: "บันทึกการตั้งค่าเรียบร้อยแล้ว!",

    welcome_to_clippy: "ยินดีต้อนรับสู่ Clippy! 📎✨",
    welcome_description:
      'เรานำ Clippy เพื่อนเก่ากลับมาในโฉมใหม่ **"Clippy"** เพื่อให้เป็นเพื่อนซี้ AI ที่ตอบไวและฉลาดที่สุดผ่าน provider API ที่คุณเลือก',
    api_ready_message:
      "API พร้อมใช้งานแล้วผ่าน {provider}! เริ่มพิมพ์คุยได้เลย",
    api_not_configured_message:
      "ยังไม่ได้ใส่ API key: ไปที่ Settings เพื่อเลือก provider และใส่ key ก่อนเริ่มคุย",
    click_clippy_head_tip:
      "💡 คลิกที่หัวของ Clippy เพื่อเปิด/ปิดหน้าต่างนี้ได้ตลอดเวลา",
    check_ai_settings: "Check AI Settings",
    configure_ai_provider: "Configure AI Provider",
  },
};

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.en;
}
