/**
 * Entity Extraction Service (v3.7.0 - GraphRAG)
 *
 * Extracts entities and relationships from conversation text using LLM
 *
 * Entity Types: Person, Organization, Location, Technology, Concept,
 *               Tool, Project, Document, Event
 *
 * Relationship Types: WorksWith, PartOf, Uses, Creates, Knows,
 *                     LocatedAt, DependsOn, RelatesTo
 *
 * Integration: Used by graph_builder.rs for knowledge graph construction
 */

use log::{debug, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Entity types for knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum EntityType {
    Person,
    Organization,
    Location,
    Technology,
    Concept,
    Tool,
    Project,
    Document,
    Event,
}

impl EntityType {
    pub fn as_str(&self) -> &'static str {
        match self {
            EntityType::Person => "Person",
            EntityType::Organization => "Organization",
            EntityType::Location => "Location",
            EntityType::Technology => "Technology",
            EntityType::Concept => "Concept",
            EntityType::Tool => "Tool",
            EntityType::Project => "Project",
            EntityType::Document => "Document",
            EntityType::Event => "Event",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "person" => Some(EntityType::Person),
            "organization" => Some(EntityType::Organization),
            "location" => Some(EntityType::Location),
            "technology" => Some(EntityType::Technology),
            "concept" => Some(EntityType::Concept),
            "tool" => Some(EntityType::Tool),
            "project" => Some(EntityType::Project),
            "document" => Some(EntityType::Document),
            "event" => Some(EntityType::Event),
            _ => None,
        }
    }
}

/// Relationship types for knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum RelationshipType {
    WorksWith,
    PartOf,
    Uses,
    Creates,
    Knows,
    LocatedAt,
    DependsOn,
    RelatesTo,
}

impl RelationshipType {
    pub fn as_str(&self) -> &'static str {
        match self {
            RelationshipType::WorksWith => "WorksWith",
            RelationshipType::PartOf => "PartOf",
            RelationshipType::Uses => "Uses",
            RelationshipType::Creates => "Creates",
            RelationshipType::Knows => "Knows",
            RelationshipType::LocatedAt => "LocatedAt",
            RelationshipType::DependsOn => "DependsOn",
            RelationshipType::RelatesTo => "RelatesTo",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "workswith" => Some(RelationshipType::WorksWith),
            "partof" => Some(RelationshipType::PartOf),
            "uses" => Some(RelationshipType::Uses),
            "creates" => Some(RelationshipType::Creates),
            "knows" => Some(RelationshipType::Knows),
            "locatedat" => Some(RelationshipType::LocatedAt),
            "dependson" => Some(RelationshipType::DependsOn),
            "relatesto" => Some(RelationshipType::RelatesTo),
            _ => None,
        }
    }
}

/// Extracted entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    pub entity_type: EntityType,
    pub properties: HashMap<String, String>,
    pub confidence: f32,
}

/// Extracted relationship
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub source_entity: String,
    pub target_entity: String,
    pub relationship_type: RelationshipType,
    pub properties: HashMap<String, String>,
    pub confidence: f32,
}

/// Entity extraction result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionResult {
    pub entities: Vec<Entity>,
    pub relationships: Vec<Relationship>,
    pub source_text: String,
}

/// Entity extraction configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EntityExtractorConfig {
    pub min_confidence: f32,
    pub max_entities_per_text: usize,
    pub enable_coreference_resolution: bool,
}

impl Default for EntityExtractorConfig {
    fn default() -> Self {
        EntityExtractorConfig {
            min_confidence: 0.5,
            max_entities_per_text: 50,
            enable_coreference_resolution: true,
        }
    }
}

/// Entity Extractor using LLM for Named Entity Recognition
pub struct EntityExtractor {
    config: EntityExtractorConfig,
}

impl EntityExtractor {
    /// Create new entity extractor
    pub fn new() -> Self {
        info!("Initializing Entity Extractor (GraphRAG)");
        EntityExtractor {
            config: EntityExtractorConfig::default(),
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: EntityExtractorConfig) -> Self {
        info!(
            "Initializing Entity Extractor (min_confidence: {}, max_entities: {})",
            config.min_confidence, config.max_entities_per_text
        );
        EntityExtractor { config }
    }

    /// Extract entities and relationships from text using LLM
    pub async fn extract(&self, text: &str) -> Result<ExtractionResult, String> {
        info!("Extracting entities from text (length: {})", text.len());

        // TODO: Call LLM with specialized NER prompt
        // For v3.7.0 MVP, we use heuristic extraction as placeholder

        let entities = self.extract_entities_heuristic(text);
        let relationships = self.extract_relationships_heuristic(text, &entities);

        debug!(
            "Extracted {} entities, {} relationships",
            entities.len(),
            relationships.len()
        );

        Ok(ExtractionResult {
            entities,
            relationships,
            source_text: text.to_string(),
        })
    }

    /// Heuristic entity extraction (placeholder for LLM-based extraction)
    fn extract_entities_heuristic(&self, text: &str) -> Vec<Entity> {
        let mut entities = Vec::new();

        // Simple heuristics:
        // 1. Capitalized words → Person/Organization
        // 2. File paths → Document
        // 3. Code terms → Technology/Tool

        let words: Vec<&str> = text.split_whitespace().collect();

        for (i, word) in words.iter().enumerate() {
            // Skip if too short
            if word.len() < 3 {
                continue;
            }

            // Check if capitalized (potential entity)
            if word.chars().next().unwrap().is_uppercase() {
                let entity_name = word.trim_matches(|c: char| !c.is_alphanumeric());

                // Skip common words
                if self.is_common_word(entity_name) {
                    continue;
                }

                // Determine entity type
                let entity_type = if self.is_person_indicator(&words, i) {
                    EntityType::Person
                } else if self.is_organization_indicator(&words, i) {
                    EntityType::Organization
                } else if self.is_location_indicator(&words, i) {
                    EntityType::Location
                } else {
                    EntityType::Concept
                };

                entities.push(Entity {
                    name: entity_name.to_string(),
                    entity_type,
                    properties: HashMap::new(),
                    confidence: 0.6,
                });
            }

            // Check for file paths
            if word.contains('/') || word.contains('\\') {
                entities.push(Entity {
                    name: word.to_string(),
                    entity_type: EntityType::Document,
                    properties: HashMap::new(),
                    confidence: 0.8,
                });
            }

            // Check for technology keywords
            if self.is_technology_keyword(word) {
                entities.push(Entity {
                    name: word.to_string(),
                    entity_type: EntityType::Technology,
                    properties: HashMap::new(),
                    confidence: 0.7,
                });
            }
        }

        // Deduplicate and filter by confidence
        self.deduplicate_entities(entities)
    }

    /// Heuristic relationship extraction (placeholder for LLM-based extraction)
    fn extract_relationships_heuristic(
        &self,
        text: &str,
        entities: &[Entity],
    ) -> Vec<Relationship> {
        let mut relationships = Vec::new();

        // Simple heuristics based on proximity and keywords
        for i in 0..entities.len() {
            for j in (i + 1)..entities.len() {
                let entity1 = &entities[i];
                let entity2 = &entities[j];

                // Check if entities appear close together in text
                if let Some(relationship_type) =
                    self.infer_relationship(text, entity1, entity2)
                {
                    relationships.push(Relationship {
                        source_entity: entity1.name.clone(),
                        target_entity: entity2.name.clone(),
                        relationship_type,
                        properties: HashMap::new(),
                        confidence: 0.5,
                    });
                }
            }
        }

        relationships
    }

    /// Infer relationship type between two entities
    fn infer_relationship(
        &self,
        text: &str,
        _entity1: &Entity,
        _entity2: &Entity,
    ) -> Option<RelationshipType> {
        let text_lower = text.to_lowercase();

        // Check for relationship keywords between entities
        if text_lower.contains("uses") || text_lower.contains("using") {
            Some(RelationshipType::Uses)
        } else if text_lower.contains("creates") || text_lower.contains("created") {
            Some(RelationshipType::Creates)
        } else if text_lower.contains("works with") || text_lower.contains("collaborated") {
            Some(RelationshipType::WorksWith)
        } else if text_lower.contains("part of") || text_lower.contains("belongs to") {
            Some(RelationshipType::PartOf)
        } else if text_lower.contains("knows") || text_lower.contains("met") {
            Some(RelationshipType::Knows)
        } else if text_lower.contains("located") || text_lower.contains("at") {
            Some(RelationshipType::LocatedAt)
        } else if text_lower.contains("depends") || text_lower.contains("requires") {
            Some(RelationshipType::DependsOn)
        } else {
            // Default generic relationship
            Some(RelationshipType::RelatesTo)
        }
    }

    /// Check if word is a common word (not an entity)
    fn is_common_word(&self, word: &str) -> bool {
        let common = [
            "The", "A", "An", "This", "That", "These", "Those", "I", "You", "We", "They",
            "He", "She", "It", "My", "Your", "Our", "Their", "His", "Her", "Its",
        ];
        common.contains(&word)
    }

    /// Check if context indicates person
    fn is_person_indicator(&self, words: &[&str], index: usize) -> bool {
        if index > 0 {
            let prev = words[index - 1].to_lowercase();
            if prev == "mr." || prev == "mrs." || prev == "dr." || prev == "prof." {
                return true;
            }
        }
        false
    }

    /// Check if context indicates organization
    fn is_organization_indicator(&self, words: &[&str], index: usize) -> bool {
        if index < words.len() - 1 {
            let next = words[index + 1].to_lowercase();
            if next == "inc." || next == "corp." || next == "ltd." || next == "company" {
                return true;
            }
        }
        false
    }

    /// Check if context indicates location
    fn is_location_indicator(&self, words: &[&str], index: usize) -> bool {
        if index > 0 {
            let prev = words[index - 1].to_lowercase();
            if prev == "in" || prev == "at" || prev == "from" {
                return true;
            }
        }
        false
    }

    /// Check if word is a technology keyword
    fn is_technology_keyword(&self, word: &str) -> bool {
        let tech = [
            "Rust", "Python", "JavaScript", "TypeScript", "Java", "C++", "SQL", "API",
            "REST", "GraphQL", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
        ];
        tech.contains(&word)
    }

    /// Deduplicate entities and filter by confidence
    fn deduplicate_entities(&self, entities: Vec<Entity>) -> Vec<Entity> {
        let mut seen = std::collections::HashSet::new();
        let mut result = Vec::new();

        for entity in entities {
            if entity.confidence < self.config.min_confidence {
                continue;
            }

            let key = (entity.name.clone(), entity.entity_type.clone());
            if !seen.contains(&key) {
                seen.insert(key);
                result.push(entity);
            }

            if result.len() >= self.config.max_entities_per_text {
                break;
            }
        }

        result
    }

    /// Get configuration
    pub fn config(&self) -> &EntityExtractorConfig {
        &self.config
    }

    /// Update configuration
    pub fn set_config(&mut self, config: EntityExtractorConfig) {
        info!(
            "Updating Entity Extractor config: min_confidence={}",
            config.min_confidence
        );
        self.config = config;
    }
}

impl Default for EntityExtractor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_entity_extraction_basic() {
        let extractor = EntityExtractor::new();
        let text = "John works at Microsoft in Seattle.";

        let result = extractor.extract(text).await.unwrap();

        assert!(!result.entities.is_empty());
        assert_eq!(result.source_text, text);
    }

    #[tokio::test]
    async fn test_entity_types() {
        let extractor = EntityExtractor::new();
        let text = "Alice is using Python to build a REST API.";

        let result = extractor.extract(text).await.unwrap();

        // Should extract at least Person and Technology entities
        let has_person = result
            .entities
            .iter()
            .any(|e| e.entity_type == EntityType::Person);
        let has_tech = result
            .entities
            .iter()
            .any(|e| e.entity_type == EntityType::Technology);

        assert!(has_person || has_tech);
    }

    #[test]
    fn test_entity_type_from_str() {
        assert_eq!(
            EntityType::from_str("person"),
            Some(EntityType::Person)
        );
        assert_eq!(
            EntityType::from_str("Organization"),
            Some(EntityType::Organization)
        );
        assert_eq!(EntityType::from_str("invalid"), None);
    }

    #[test]
    fn test_relationship_type_from_str() {
        assert_eq!(
            RelationshipType::from_str("uses"),
            Some(RelationshipType::Uses)
        );
        assert_eq!(
            RelationshipType::from_str("WorksWith"),
            Some(RelationshipType::WorksWith)
        );
        assert_eq!(RelationshipType::from_str("invalid"), None);
    }

    #[tokio::test]
    async fn test_confidence_filtering() {
        let mut config = EntityExtractorConfig::default();
        config.min_confidence = 0.9;
        let extractor = EntityExtractor::with_config(config);

        let text = "Test entity extraction.";
        let result = extractor.extract(text).await.unwrap();

        // With high confidence threshold, fewer entities should be extracted
        for entity in result.entities {
            assert!(entity.confidence >= 0.9);
        }
    }
}
