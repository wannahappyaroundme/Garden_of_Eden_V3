/**
 * Phase 1: LAM (Large Action Model) Integration Tests
 *
 * Tests for computer control functionality:
 * - Service initialization
 * - Safety configuration
 * - Action types
 * - Database integration
 * - Tool registration
 */

#[cfg(test)]
mod lam_phase1_tests {
    use super::super::computer_control::*;
    use super::super::screen::ScreenCaptureService;
    use super::super::llava::LlavaService;
    use crate::database::Database;
    use rusqlite::Connection;
    use std::sync::{Arc, Mutex};

    fn create_test_db() -> (Arc<Mutex<Database>>, Arc<Mutex<Connection>>) {
        let db = Database::new_test_db().expect("Failed to create test database");
        let db_arc = Arc::new(Mutex::new(db));

        // Also create a connection for ComputerControlService
        let conn = Connection::open_in_memory().expect("Failed to create connection");
        let conn_arc = Arc::new(Mutex::new(conn));

        (db_arc, conn_arc)
    }

    fn create_test_service() -> Result<ComputerControlService, anyhow::Error> {
        let (db_arc, conn_arc) = create_test_db();
        let screen_service = Arc::new(ScreenCaptureService::new(db_arc));
        let llava_service = Arc::new(LlavaService::new().unwrap());

        ComputerControlService::new(screen_service, llava_service, conn_arc)
    }

    #[test]
    fn test_service_initialization() {
        let service = create_test_service();
        assert!(service.is_ok(), "Service should initialize successfully");
    }

    #[test]
    fn test_database_table_creation() {
        let service = create_test_service().expect("Failed to create service");
        let db = service.db.lock().unwrap();

        // Check if computer_actions table exists
        let table_exists: bool = db
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='computer_actions'",
                [],
                |row| row.get(0),
            )
            .map(|count: i32| count > 0)
            .unwrap_or(false);

        assert!(table_exists, "computer_actions table should be created");
    }

    #[test]
    fn test_safety_config_default() {
        let service = create_test_service().expect("Failed to create service");
        let config = service.get_safety_config();

        assert_eq!(config.animation_speed_ms, 200);
        assert!(config.enable_preview);
        assert_eq!(config.restricted_zones.len(), 3); // System Preferences, Terminal, Trash
    }

    #[test]
    fn test_action_type_serialization() {
        let action = ActionType::Click;
        let json = serde_json::to_string(&action).expect("Should serialize");
        assert_eq!(json, "\"click\"");

        let action2 = ActionType::AppleScript;
        let json2 = serde_json::to_string(&action2).expect("Should serialize");
        assert_eq!(json2, "\"applescript\"");
    }

    #[test]
    fn test_action_type_partial_eq() {
        assert_eq!(ActionType::Click, ActionType::Click);
        assert_ne!(ActionType::Click, ActionType::Type);
        assert!(ActionType::AppleScript == ActionType::AppleScript);
    }

    #[test]
    fn test_bounding_box_parsing() {
        let json = r#"{"x": 100, "y": 200, "width": 50, "height": 30}"#;
        let bbox: BoundingBox = serde_json::from_str(json).expect("Should parse");

        assert_eq!(bbox.x, 100);
        assert_eq!(bbox.y, 200);
        assert_eq!(bbox.width, 50);
        assert_eq!(bbox.height, 30);
    }

    #[test]
    fn test_restricted_zone_serialization() {
        let zone = RestrictedZone {
            name: "Test Zone".to_string(),
            bounds: Some(BoundingBox {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
            }),
            app_bundle_id: Some("com.test.app".to_string()),
            requires_approval: true,
        };

        let json = serde_json::to_string(&zone).expect("Should serialize");
        let zone2: RestrictedZone = serde_json::from_str(&json).expect("Should deserialize");

        assert_eq!(zone2.name, "Test Zone");
        assert!(zone2.requires_approval);
    }

    #[test]
    fn test_action_result_structure() {
        let result = ActionResult {
            success: true,
            action_type: ActionType::Click,
            target_description: Some("Submit Button".to_string()),
            coordinates: Some((100, 200)),
            execution_time_ms: 150,
            error: None,
            screenshot_before: Some("base64data".to_string()),
            screenshot_after: Some("base64data2".to_string()),
        };

        assert!(result.success);
        assert_eq!(result.execution_time_ms, 150);
        assert!(result.coordinates.is_some());
    }

    #[test]
    fn test_safety_config_update() {
        let mut service = create_test_service().expect("Failed to create service");

        let new_config = SafetyConfig {
            restricted_zones: vec![],
            require_confirmation: vec![ActionType::Click],
            animation_speed_ms: 0,
            enable_preview: false,
        };

        service.update_safety_config(new_config);
        let config = service.get_safety_config();

        assert_eq!(config.animation_speed_ms, 0);
        assert!(!config.enable_preview);
        assert_eq!(config.restricted_zones.len(), 0);
    }

    #[test]
    fn test_get_action_history_empty() {
        let service = create_test_service().expect("Failed to create service");
        let history = service.get_action_history(10).expect("Should get history");

        assert_eq!(history.len(), 0, "Fresh service should have no history");
    }

    #[test]
    fn test_clear_action_history() {
        let service = create_test_service().expect("Failed to create service");
        let count = service.clear_action_history().expect("Should clear history");

        assert_eq!(count, 0, "Empty history should clear 0 items");
    }

    #[test]
    fn test_key_mapping() {
        let service = create_test_service().expect("Failed to create service");

        // Test valid key mappings
        assert!(service.map_key_string_to_rdev("enter").is_ok());
        assert!(service.map_key_string_to_rdev("escape").is_ok());
        assert!(service.map_key_string_to_rdev("tab").is_ok());
        assert!(service.map_key_string_to_rdev("a").is_ok());
        assert!(service.map_key_string_to_rdev("1").is_ok());

        // Test invalid key
        assert!(service.map_key_string_to_rdev("invalid_key_12345").is_err());
    }

    #[test]
    fn test_check_safety_restrictions_allowed() {
        let service = create_test_service().expect("Failed to create service");

        // Normal coordinates should be allowed
        let result = service.check_safety_restrictions(500, 500, &ActionType::Click);
        assert!(result.is_ok(), "Normal coordinates should be allowed");
    }

    #[test]
    fn test_check_safety_restrictions_applescript() {
        let service = create_test_service().expect("Failed to create service");

        // AppleScript should require confirmation by default
        let result = service.check_safety_restrictions(0, 0, &ActionType::AppleScript);
        assert!(result.is_err(), "AppleScript should require confirmation");
    }

    #[test]
    fn test_enigo_creation() {
        let service = create_test_service().expect("Failed to create service");
        let enigo = service.create_enigo();

        assert!(enigo.is_ok(), "Should be able to create Enigo instance");
    }
}

#[cfg(test)]
mod lam_tools_tests {
    use super::super::lam_tools::*;
    use super::super::computer_control::ComputerControlService;
    use super::super::tool_calling::{ToolCategory, ParameterType, ToolExecutor};
    use std::sync::Arc;

    fn create_mock_service() -> Arc<ComputerControlService> {
        use super::super::screen::ScreenCaptureService;
        use super::super::llava::LlavaService;
        use crate::database::Database;
        use rusqlite::Connection;
        use std::sync::Mutex;

        let db_arc = Arc::new(Mutex::new(Database::new_test_db().unwrap()));
        let conn_arc = Arc::new(Mutex::new(Connection::open_in_memory().unwrap()));

        let screen_service = Arc::new(ScreenCaptureService::new(db_arc));
        let llava_service = Arc::new(LlavaService::new().unwrap());

        Arc::new(ComputerControlService::new(screen_service, llava_service, conn_arc).unwrap())
    }

    #[test]
    fn test_mouse_click_tool_definition() {
        let service = create_mock_service();
        let tool = MouseClickTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "mouse_click");
        assert_eq!(def.category, ToolCategory::System);
        assert_eq!(def.parameters.len(), 1);
        assert_eq!(def.parameters[0].name, "description");
        assert_eq!(def.parameters[0].param_type, ParameterType::String);
        assert!(def.parameters[0].required);
    }

    #[test]
    fn test_type_text_tool_definition() {
        let service = create_mock_service();
        let tool = TypeTextTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "type_text");
        assert_eq!(def.parameters.len(), 1);
        assert_eq!(def.parameters[0].name, "text");
    }

    #[test]
    fn test_key_press_tool_definition() {
        let service = create_mock_service();
        let tool = KeyPressTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "press_key");
        assert!(def.description.contains("keyboard key"));
    }

    #[test]
    fn test_scroll_tool_definition() {
        let service = create_mock_service();
        let tool = ScrollTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "scroll");
        assert_eq!(def.parameters.len(), 2);

        // Check direction parameter has enum values
        let direction_param = &def.parameters[0];
        assert_eq!(direction_param.name, "direction");
        assert!(direction_param.enum_values.is_some());

        let enum_vals = direction_param.enum_values.as_ref().unwrap();
        assert_eq!(enum_vals.len(), 4);
        assert!(enum_vals.contains(&"up".to_string()));
        assert!(enum_vals.contains(&"down".to_string()));
    }

    #[test]
    fn test_wait_tool_definition() {
        let service = create_mock_service();
        let tool = WaitTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "wait");
        assert_eq!(def.parameters[0].name, "milliseconds");
        assert_eq!(def.parameters[0].param_type, ParameterType::Number);
    }

    #[test]
    fn test_move_mouse_tool_definition() {
        let service = create_mock_service();
        let tool = MoveMouseTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "move_mouse");
        assert_eq!(def.parameters.len(), 2);
        assert_eq!(def.parameters[0].name, "x");
        assert_eq!(def.parameters[1].name, "y");
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn test_applescript_tool_definition() {
        let service = create_mock_service();
        let tool = AppleScriptTool::new(service);
        let def = tool.definition();

        assert_eq!(def.name, "applescript");
        assert_eq!(def.parameters.len(), 1);
        assert_eq!(def.parameters[0].name, "script");
    }

    #[test]
    fn test_all_tools_have_unique_names() {
        let service = create_mock_service();

        let mut names: Vec<String> = Vec::new();

        names.push(MouseClickTool::new(Arc::clone(&service)).definition().name);
        names.push(TypeTextTool::new(Arc::clone(&service)).definition().name);
        names.push(KeyPressTool::new(Arc::clone(&service)).definition().name);
        names.push(ScrollTool::new(Arc::clone(&service)).definition().name);
        names.push(WaitTool::new(Arc::clone(&service)).definition().name);
        names.push(MoveMouseTool::new(Arc::clone(&service)).definition().name);

        #[cfg(target_os = "macos")]
        names.push(AppleScriptTool::new(Arc::clone(&service)).definition().name);

        let original_len = names.len();
        names.sort();
        names.dedup();

        assert_eq!(names.len(), original_len, "All tool names should be unique");
    }
}
