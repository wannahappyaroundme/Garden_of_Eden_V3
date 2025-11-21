/**
 * Integration Tests for v3.7.0 Features
 *
 * Tests for GraphRAG, ReAct Agent, and Plan-and-Solve
 */

#[cfg(test)]
mod graphrag_tests {
    use garden_of_eden_v3::services::entity_extractor::{EntityExtractor, EntityType, RelationshipType};
    use garden_of_eden_v3::services::graph_builder::GraphBuilder;
    use garden_of_eden_v3::services::graph_storage::GraphStorage;
    use garden_of_eden_v3::services::graph_retrieval::GraphRetrievalEngine;
    use std::sync::Arc;
    use tokio;

    #[tokio::test]
    async fn test_entity_extraction() {
        let extractor = EntityExtractor::new();
        let text = "John works at Microsoft. Microsoft is located in Seattle.";

        let result = extractor.extract(text).await.unwrap();

        assert!(!result.entities.is_empty());
        assert!(!result.relationships.is_empty());
    }

    #[tokio::test]
    async fn test_graph_building() {
        let extractor = EntityExtractor::new();
        let extractor_arc = Arc::new(extractor);

        let mut builder = GraphBuilder::new(Arc::clone(&extractor_arc));
        let text = "Rust is a programming language. Rust is used for systems programming.";

        builder.build_from_text(text).await.unwrap();

        let stats = builder.stats();
        assert!(stats.total_entities > 0);
    }

    #[test]
    fn test_graph_storage() {
        let storage = GraphStorage::new(":memory:").unwrap();

        // Create test entity
        let entity = garden_of_eden_v3::services::graph_builder::GraphNode {
            entity_id: "test_1".to_string(),
            name: "Test Entity".to_string(),
            entity_type: "Technology".to_string(),
            properties: serde_json::json!({"description": "Test"}),
            community_id: None,
            degree: 0,
        };

        storage.save_entity(&entity).unwrap();

        let loaded = storage.load_entity("test_1").unwrap();
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().name, "Test Entity");
    }

    #[test]
    fn test_graph_retrieval() {
        let storage = GraphStorage::new(":memory:").unwrap();
        let storage_arc = Arc::new(storage);

        // Create test entities
        let entity1 = garden_of_eden_v3::services::graph_builder::GraphNode {
            entity_id: "rust".to_string(),
            name: "Rust".to_string(),
            entity_type: "Technology".to_string(),
            properties: serde_json::json!({}),
            community_id: None,
            degree: 0,
        };

        storage_arc.save_entity(&entity1).unwrap();

        let retrieval = GraphRetrievalEngine::new(Arc::clone(&storage_arc));
        let results = retrieval.retrieve("Rust programming").unwrap();

        // Should find at least one result
        assert!(!results.is_empty());
    }

    #[tokio::test]
    async fn test_community_detection() {
        let extractor = EntityExtractor::new();
        let extractor_arc = Arc::new(extractor);

        let mut builder = GraphBuilder::new(Arc::clone(&extractor_arc));

        // Add interconnected entities
        let text = "Alice works with Bob. Bob works with Charlie. Alice knows Charlie.";
        builder.build_from_text(text).await.unwrap();

        let stats = builder.stats();
        assert!(stats.total_communities > 0);
    }
}

#[cfg(test)]
mod react_tests {
    use garden_of_eden_v3::services::react_agent::{ReActAgent, ReActConfig, ReActStep};
    use garden_of_eden_v3::services::tool_calling::ToolService;
    use std::sync::Arc;

    #[test]
    fn test_react_config() {
        let config = ReActConfig::default();
        assert_eq!(config.max_iterations, 5);
        assert_eq!(config.model, "qwen2.5:7b");
        assert_eq!(config.temperature, 0.1);
    }

    #[test]
    fn test_react_step_type() {
        let thought = ReActStep::Thought("Thinking...".to_string());
        assert_eq!(thought.step_type(), "Thought");

        let answer = ReActStep::Answer("Done!".to_string());
        assert_eq!(answer.step_type(), "Answer");
    }

    #[test]
    fn test_react_agent_creation() {
        let tool_service = Arc::new(ToolService::new());
        let agent = ReActAgent::new(
            "http://localhost:11434".to_string(),
            tool_service,
        );

        let config = agent.config();
        assert_eq!(config.max_iterations, 5);
    }

    #[test]
    fn test_react_is_complete() {
        let tool_service = Arc::new(ToolService::new());
        let agent = ReActAgent::new(
            "http://localhost:11434".to_string(),
            tool_service,
        );

        let steps_incomplete = vec![
            ReActStep::Thought("Thinking...".to_string()),
        ];
        assert!(!agent.is_complete(&steps_incomplete));

        let steps_complete = vec![
            ReActStep::Thought("Thinking...".to_string()),
            ReActStep::Answer("Done!".to_string()),
        ];
        assert!(agent.is_complete(&steps_complete));
    }

    #[test]
    fn test_react_step_content() {
        let thought = ReActStep::Thought("I need to search".to_string());
        assert_eq!(thought.content(), "I need to search");

        let answer = ReActStep::Answer("Here is the result".to_string());
        assert_eq!(answer.content(), "Here is the result");
    }
}

#[cfg(test)]
mod planner_tests {
    use garden_of_eden_v3::services::planner::{Plan, PlanStep, StepStatus, Planner, PlannerConfig};
    use garden_of_eden_v3::services::react_agent::ReActAgent;
    use garden_of_eden_v3::services::tool_calling::ToolService;
    use std::sync::Arc;

    #[test]
    fn test_plan_progress() {
        let plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "Action 1".to_string(),
                    expected_output: "Output 1".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
                PlanStep {
                    step_number: 2,
                    description: "Step 2".to_string(),
                    action: "Action 2".to_string(),
                    expected_output: "Output 2".to_string(),
                    depends_on: vec![1],
                    status: StepStatus::Pending,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "5 minutes".to_string(),
            required_tools: vec!["web_search".to_string()],
            risks: vec!["Network connectivity".to_string()],
            created_at: 0,
            user_approved: false,
            execution_started: false,
            completed: false,
        };

        assert_eq!(plan.progress(), 50.0);
    }

    #[test]
    fn test_plan_next_step() {
        let plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "Action 1".to_string(),
                    expected_output: "Output 1".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
                PlanStep {
                    step_number: 2,
                    description: "Step 2".to_string(),
                    action: "Action 2".to_string(),
                    expected_output: "Output 2".to_string(),
                    depends_on: vec![1],
                    status: StepStatus::Pending,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "5 minutes".to_string(),
            required_tools: vec![],
            risks: vec![],
            created_at: 0,
            user_approved: true,
            execution_started: false,
            completed: false,
        };

        let next = plan.next_step();
        assert!(next.is_some());
        assert_eq!(next.unwrap().step_number, 2);
    }

    #[test]
    fn test_plan_is_complete() {
        let mut plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "Action 1".to_string(),
                    expected_output: "Output 1".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "1 minute".to_string(),
            required_tools: vec![],
            risks: vec![],
            created_at: 0,
            user_approved: true,
            execution_started: false,
            completed: false,
        };

        assert!(plan.is_complete());

        plan.steps[0].status = StepStatus::Pending;
        assert!(!plan.is_complete());
    }

    #[test]
    fn test_plan_failed_steps() {
        let plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "Action 1".to_string(),
                    expected_output: "Output 1".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Failed,
                    result: None,
                    error: Some("Test error".to_string()),
                },
                PlanStep {
                    step_number: 2,
                    description: "Step 2".to_string(),
                    action: "Action 2".to_string(),
                    expected_output: "Output 2".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "2 minutes".to_string(),
            required_tools: vec![],
            risks: vec![],
            created_at: 0,
            user_approved: true,
            execution_started: false,
            completed: false,
        };

        let failed = plan.failed_steps();
        assert_eq!(failed.len(), 1);
        assert_eq!(failed[0].step_number, 1);
    }

    #[test]
    fn test_planner_config() {
        let config = PlannerConfig::default();
        assert_eq!(config.max_steps, 10);
        assert_eq!(config.model, "qwen2.5:7b");
        assert_eq!(config.temperature, 0.3);
        assert!(config.enable_auto_recovery);
        assert_eq!(config.max_retry_attempts, 2);
    }

    #[test]
    fn test_planner_creation() {
        let tool_service = Arc::new(ToolService::new());
        let react_agent = Arc::new(ReActAgent::new(
            "http://localhost:11434".to_string(),
            tool_service,
        ));

        let planner = Planner::new(
            "http://localhost:11434".to_string(),
            react_agent,
        );

        let config = planner.config();
        assert_eq!(config.max_steps, 10);
    }
}
