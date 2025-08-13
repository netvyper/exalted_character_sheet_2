# AI Storyteller Application: Design Document

**Version:** 1.0
**Date:** 2025-08-12

## 1.0 Overview

This document outlines the architecture and specifications for an AI-powered storytelling application. The application will function as a "Dungeon Master" for solo role-playing campaigns, leveraging a forked version of the `lotcastingatemi` (LCA) web application and Google's Gemini API. The primary goal is to create an interactive, dynamic narrative experience where the AI can manage story progression, world state, and character interactions, while the player interacts through a chat interface.

The core challenges this design addresses are:
* **Minimizing API Costs:** Efficiently managing large context files (rules, lore) to reduce token usage.
* **State Management:** Allowing the AI and player to dynamically update campaign files.
* **Seamless Integration:** Integrating a chat interface and dice roller into the existing LCA framework.
* **AI Control:** Enabling the AI to make specific, actionable changes to player character data.

---

## 2.0 System Architecture

The application will use a three-tier architecture leveraging the existing `lotcastingatemi` stack, augmented with Google Cloud services for AI and knowledge management.

* **Frontend (Client-Side):** A **React.js** single-page application responsible for all user interaction.
* **Backend (Server-Side):** A **Ruby on Rails** API server that manages application logic, user authentication, and communication with external services.
* **Database:** A **PostgreSQL** database for storing user, campaign, and character sheet data.
* **AI Model:** **Google Gemini API** (via the `google-generative_ai` Ruby gem).
* **Knowledge Base:** **Google Cloud Vertex AI Search** for implementing Retrieval-Augmented Generation (RAG).
* **Deployment:** A **Docker-containerized** environment for consistent setup and deployment.

---

## 3.0 Data Management & File Structure

Data will be segregated into three distinct categories, each handled by a specific system.

### 3.1 AI Instructions (System Prompt)

* **File:** `AIA-ST Persona & Tasks.md`
* **Handling:** The **full content** of this file will be treated as a **system prompt**. It will be loaded from the application's file system and prepended to **every API call** made to the Gemini model. This ensures the AI's core persona and directives are constantly reinforced.

### 3.2 Reference Files (Static Knowledge Base)

* **Files:** `core_ruleset.md`, `charms-all.md`, `gazetteer.md`, and any other large, unchanging lore or rule documents.
* **Handling:** These files will be ingested into a **Vertex AI Search data store**. The application will use a RAG (Retrieval-Augmented Generation) workflow. When a user's prompt is received, the backend will first query the Vertex AI Search index to retrieve only the most relevant snippets of information. These snippets, not the full files, will be added to the Gemini prompt.

### 3.3 State Data (Dynamic Knowledge Base)

* **Files:** `chronicle.md`, `dramatis_personae.md`, etc. These files track the live state of the campaign and are modified by the AI.
* **Handling:** A **dual-RAG solution** will be implemented.
    1.  A **second, separate data store** will be created in Vertex AI Search specifically for these dynamic files.
    2.  During gameplay, this index will be queried for context just like the static knowledge base.
    3.  When a session concludes or reaches a designated checkpoint, the player will trigger an "End Session" action.
    4.  This action will prompt the AI to provide a final, updated version of the dynamic files.
    5.  The backend will save these new versions to the file system (and commit to Git for version control).
    6.  Finally, the backend will trigger a **re-indexing** of the updated files in the dynamic Vertex AI Search data store.

---

## 4.0 Feature Specifications

### 4.1 Chat Component

* A new React component, `ChatInterface.js`, will be created.
* This component will manage the display of the conversation history and a text input for the player.
* It will make API calls to a new `ai_storyteller_controller.rb` in the Rails backend.
* The backend will manage the conversation history, which will be saved to the database to persist between user sessions.

### 4.2 Dice Roller Component

* A new React component, `DiceRoller.js`, will be created, replicating the UI and logic of the provided standalone application.
* The component will be styled to match the LCA aesthetic.
* It will be integrated into the main campaign view (`Chronicle.js`) to be accessible during gameplay.

### 4.3 AI Control over Player Character Sheets

* The AI will be instructed to communicate changes to player character stats via a structured format.
* When the narrative requires a stat change, the Gemini API response will be a JSON object containing two keys:
    1.  `narrative`: The descriptive text for the player.
    2.  `actions`: An array of specific, machine-readable action objects.
* **Example `actions` object:**
    ```json
    {
      "actions": [
        {
          "action": "UPDATE_ESSENCE",
          "characterId": "player_character_id",
          "change": -5,
          "pool": "personal"
        }
      ]
    }
    ```
* The Rails backend will parse this `actions` array and execute the corresponding database updates against the player's character model. NPC stats will be managed internally by the AI and are not subject to this structured update mechanism.

---

## 5.0 Development Roadmap

1.  **Environment Setup:** Configure the forked LCA project to run locally using Docker.
2.  **Vertex AI Setup:** Create two data stores in Vertex AI Search (one for static, one for dynamic files) and ingest the initial documents.
3.  **Backend Development (Ruby on Rails):**
    * Create the `ai_storyteller_controller.rb`.
    * Implement the RAG workflow:
        * Receive player prompt.
        * Query both Vertex AI Search data stores.
        * Construct the final prompt for Gemini (System Instructions + Retrieved Context + Chat History + Player Prompt).
    * Implement the "End Session" logic for updating and re-indexing dynamic files.
    * Implement the parser for the AI `actions` JSON to update the database.
4.  **Frontend Development (React):**
    * Build and style the `DiceRoller.js` component and integrate it into `Chronicle.js`.
    * Build and style the `ChatInterface.js` component.
    * Connect the `ChatInterface.js` to the new backend endpoints.
5.  **Testing and Refinement:** Conduct end-to-end testing of the full gameplay loop.


Blueprint: AI Roleplaying Game Application (LCA Integration)
1. Overview and Core Principles
This document outlines the system architecture for a dynamic, AI-powered roleplaying game application, designed to integrate with the lotcastingatemi (LCA) platform. The primary goal is to create a responsive and immersive storytelling experience while maintaining cost-efficiency and allowing for a game world that evolves through player and AI interaction with the LCA backend.

The architecture is built on three core principles:

Modularity: Data sources are managed independently based on their type and priority (Core Rules vs. Living World State).

Cost-Efficiency: The system aggressively minimizes API costs through an optimized context caching strategy and by using the most appropriate tool for each task.

Dynamic World: The application is a "living" system where the AI can directly modify the LCA character sheet and campaign database via API tools, persisting all in-game changes.

2. System Architecture Diagram
The system is composed of four main components: the User Interface (LCA Front End), the Backend Session Manager, the Gemini API, and the various Data Sources including the LCA API. The ChatSessionManager is the central orchestrator.

graph TD
    subgraph User
        UI[LCA Front End]
    end

    subgraph Backend
        Manager[ChatSessionManager]
    end

    subgraph Google Cloud
        Gemini[Gemini 1.5 Pro API]
    end

    subgraph Data Stores
        CorpusLow[Low-Priority Corpus: Core Rulebooks]
        CorpusHigh[High-Priority Corpus: Living World]
        LCA_API[LCA API: Character Sheets, DB]
        Cache[Context Cache: Session History]
    end

    UI -- User Prompt --> Manager
    Manager -- Assembled Request --> Gemini
    Gemini -- Response --> Manager
    Manager -- Formatted Response --> UI

    Manager -- Manages --> Cache
    Gemini -- Uses --> Cache

    Gemini -- Invokes Tool --> CorpusLow
    Gemini -- Invokes Tool --> CorpusHigh
    Gemini -- Invokes Tool --> Manager

    subgraph Function Calling
      Manager -- Executes Function --> LCA_API
    end

3. Data Source Management
The architecture uses a prioritized, multi-source strategy to ensure the AI uses the most relevant and up-to-date information.

3.1. Core Rulebooks (Low Priority)
Strategy: Integrated RAG

Implementation: All large, static rulebooks will be uploaded into a Corpus (e.g., lca-core-rules-corpus).

Access Method: The AI will be instructed to use this Tool as a last resort, only if a query cannot be answered by other, higher-priority sources.

3.2. Living World Data (High Priority)
Strategy: Integrated RAG

Implementation: A second, high-priority Corpus (e.g., lca-campaign-data-corpus) will contain the dynamic "state" of the specific campaign: the Chronicle, Dramatis Personae, Gazetteer, summarized rules, and examples of items/spells.

Access Method: The AI will be instructed to prioritize this Tool for all lore and context-related queries.

3.3. Character Sheet & Live Game State
Strategy: Direct API Integration via Function Calling

Implementation: The lotcastingatemi (LCA) application's own API serves as the canonical source of truth for all character data.

Access Method: The Gemini model will be given Tool definitions for functions that call the LCA API directly (e.g., update_character_health, add_item_to_inventory). This allows for real-time, persistent changes to the character sheet.

3.4. Dynamic Session State (Chronicle & Initial Context)
Strategy: Context Caching

Implementation: The initial context for any session will be immediately cached. This cache will contain the core Storyteller (ST) instructions and a JSON object representing the player's current character sheet, retrieved from the LCA API.

Access Method: Subsequent chat history is periodically "checkpointed" into new caches, solving the snowballing context problem.

4. Core Backend Component: ChatSessionManager
The ChatSessionManager orchestrates the session, managing the state and tool use.

Class Structure (Conceptual)
class ChatSessionManager:
    # --- Properties ---
    live_history: list
    live_history_tokens: int
    active_cache_name: str
    
    # --- Constants ---
    CACHE_THRESHOLD = 5000

    # --- Methods ---
    def __init__(self, st_instructions, character_sheet_json):
        # Initializes the session, creates the first cache from ST instructions + character sheet.
        pass

    def handle_new_message(self, user_prompt):
        # Main method orchestrating the entire request lifecycle.
        pass

    def _create_checkpoint(self, content_to_cache):
        # Creates a new cache and returns its name.
        pass

    # --- Tool-bound Functions (LCA API Wrappers) ---
    def get_character_health(self, character_id: str):
        # Calls LCA API GET /characters/{id}/health
        pass
    
    def update_character_health(self, character_id: str, new_health: int):
        # Calls LCA API PUT /characters/{id}/health
        pass

    def add_item_to_inventory(self, character_id: str, item_json: dict):
        # Calls LCA API POST /characters/{id}/inventory
        pass

5. Request Lifecycle Walkthrough
User Prompt: "I loot the mage's equipment, hoping for a fire-enhancing ring. If I find one, let's reduce its damage bonus by 2 and add it to my sheet."

Receive: The ChatSessionManager receives the prompt.

API Call: The manager calls generate_content with:

contents: The live history + new prompt.

cached_content: The active session cache (containing ST instructions and the initial character sheet state).

tools: A list of all available tools: the two RAG Corpus tools and all LCA API function tools.

Model Reasoning & Collaboration:

The model uses the cache to understand the context of the scene.

It sees the request for a "fire enhancing ring" and may consult the high-priority campaign-data-corpus for examples.

It generates a proposal for the ring and its stats.

It processes the user's follow-up negotiation ("reduce the damage enhancement by 2").

It generates the final, agreed-upon stats for the new item.

Recognizing the intent "add it to my sheet," it formulates a call to the add_item_to_inventory() function with the character's ID and the new item's JSON.

Backend Execution: The ChatSessionManager receives the function call and makes a POST request to the LCA API, which updates the character's database entry.

Final Response: The model receives the success message from the function call and generates the final narrative response for the user.

State Update & Checkpoint: The manager updates the live_history and checks if it's time to create a new checkpoint cache.

6. Caching Strategy
In-Session: An aggressive checkpointing strategy is used. A new cache is created when the live_history exceeds 5,000 tokens.

Post-Session: At the end of a session, the entire session log is saved as a final cache. This allows for efficient "out-of-character" tasks like summarizing the session for the chronicle, updating the gazetteer, or reviewing events without incurring high narrative generation costs. Caches should have a TTL (e.g., 12 hours) for automatic cleanup.
